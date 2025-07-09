import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onCall } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { Bunny } from './types';

// Configuration for idle checking
const IDLE_THRESHOLD_HOURS = 3; // Bunnies become idle after 3 hours without activity

// Shared logic for checking idle bunnies
async function runIdleBunnyCheck() {
  const db = admin.firestore();
  const currentTime = admin.firestore.Timestamp.now();

  // Calculate the threshold time (3 hours ago)
  const thresholdTime = new Date(currentTime.toDate().getTime() - (IDLE_THRESHOLD_HOURS * 60 * 60 * 1000));
  const thresholdTimestamp = admin.firestore.Timestamp.fromDate(thresholdTime);

  // Get all bunnies
  const bunniesSnapshot = await db.collection('bunnies').get();
  if (bunniesSnapshot.empty) {
    return { idleEvents: [], idleBunnies: [], thresholdTime };
  }

  const idleEvents: any[] = [];
  const idleBunnies: any[] = [];

  // Check each bunny for idle status
  for (const bunnyDoc of bunniesSnapshot.docs) {
    const bunny = bunnyDoc.data() as Bunny;
    const bunnyId = bunnyDoc.id;
    const lastFeed = bunny.lastFeed;
    const lastPlay = bunny.lastPlay;
    const isIdle = (!lastFeed || lastFeed.toDate() < thresholdTime) &&
                   (!lastPlay || lastPlay.toDate() < thresholdTime);
    if (isIdle) {
      idleBunnies.push({
        id: bunnyId,
        name: bunny.name,
        lastFeed: lastFeed?.toDate(),
        lastPlay: lastPlay?.toDate()
      });
      // Create idle event
      const idleEvent = {
        bunnyId: bunnyId,
        eventType: 'idle',
        status: 'pending',
        createdAt: currentTime,
        eventData: {
          reason: 'No activity in last 3 hours',
          lastFeed: lastFeed || null,
          lastPlay: lastPlay || null,
          thresholdTime: thresholdTimestamp
        }
      };
      idleEvents.push(idleEvent);
    }
  }

  // Create all idle events in a batch
  if (idleEvents.length > 0) {
    const batch = db.batch();
    idleEvents.forEach((event) => {
      const eventRef = db.collection('bunnieEvent').doc();
      batch.set(eventRef, event);
    });
    await batch.commit();
  }

  return { idleEvents, idleBunnies, thresholdTime };
}

export const checkIdleBunnies = onSchedule({
  schedule: '0 * * * *', // Run every hour on the hour (cron format)
  timeZone: 'UTC',
  retryCount: 3,
  maxInstances: 1, // Only one instance should run at a time
}, async (event) => {
  console.log('Starting idle bunny check at:', new Date().toISOString());
  try {
    const { idleEvents } = await runIdleBunnyCheck();
    if (idleEvents.length > 0) {
      console.log(`Created ${idleEvents.length} idle events`);
    } else {
      console.log('No idle bunnies found');
    }
    console.log('Idle bunny check completed successfully');
  } catch (error) {
    console.error('Error in idle bunny check:', error);
    throw error; // Re-throw to trigger retry
  }
});

export const manualCheckIdleBunnies = onCall({
  maxInstances: 1,
  memory: '256MiB',
  timeoutSeconds: 60,
}, async (request) => {
  console.log('Manual idle bunny check triggered at:', new Date().toISOString());
  try {
    const { idleEvents, idleBunnies, thresholdTime } = await runIdleBunnyCheck();
    return {
      success: true,
      message: `Found ${idleEvents.length} idle bunnies`,
      idleCount: idleEvents.length,
      idleBunnies: idleBunnies,
      thresholdTime: thresholdTime.toISOString()
    };
  } catch (error: any) {
    console.error('Error in manual idle bunny check:', error);
    return {
      success: false,
      error: error.message || 'Failed to check idle bunnies'
    };
  }
});
