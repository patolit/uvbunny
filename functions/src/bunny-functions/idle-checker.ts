import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';
import { Bunny } from './types';

// Configuration for idle checking
const IDLE_THRESHOLD_HOURS = 3; // Bunnies become idle after 3 hours without activity

export const checkIdleBunnies = onSchedule({
  schedule: '0 * * * *', // Run every hour on the hour (cron format)
  timeZone: 'UTC',
  retryCount: 3,
  maxInstances: 1, // Only one instance should run at a time
}, async (event) => {
  console.log('Starting idle bunny check at:', new Date().toISOString());

  try {
    const db = admin.firestore();
    const currentTime = admin.firestore.Timestamp.now();

    // Calculate the threshold time (3 hours ago)
    const thresholdTime = new Date(currentTime.toDate().getTime() - (IDLE_THRESHOLD_HOURS * 60 * 60 * 1000));
    const thresholdTimestamp = admin.firestore.Timestamp.fromDate(thresholdTime);

    console.log(`Checking for bunnies inactive since: ${thresholdTime.toISOString()}`);

    // Get all bunnies
    const bunniesSnapshot = await db.collection('bunnies').get();

    if (bunniesSnapshot.empty) {
      console.log('No bunnies found');
      return;
    }

    const idleEvents: any[] = [];

    // Check each bunny for idle status
    for (const bunnyDoc of bunniesSnapshot.docs) {
      const bunny = bunnyDoc.data() as Bunny;
      const bunnyId = bunnyDoc.id;

      // Check if bunny has been idle (no feed or play in last 3 hours)
      const lastFeed = bunny.lastFeed;
      const lastPlay = bunny.lastPlay;

      const isIdle = (!lastFeed || lastFeed.toDate() < thresholdTime) &&
                     (!lastPlay || lastPlay.toDate() < thresholdTime);

      if (isIdle) {
        console.log(`Bunny ${bunny.name} (${bunnyId}) is idle - last feed: ${lastFeed?.toDate()}, last play: ${lastPlay?.toDate()}`);

        // Create idle event
        const idleEvent = {
          bunnyId: bunnyId,
          eventType: 'idle',
          status: 'pending',
          createdAt: currentTime,
          eventData: {
            reason: 'No activity in last 3 hours',
            lastFeed: lastFeed,
            lastPlay: lastPlay,
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
