import * as admin from "firebase-admin";
import { Bunny, Configuration, EventStatus } from "./types";

// Get Firestore instance - this will be initialized when the function is called
function getDb() {
  return admin.firestore();
}

// Validation constants
const MIN_PLAY_INTERVAL = 4000; // 4 seconds in milliseconds
const MIN_FEED_INTERVAL = 4000; // 4 seconds in milliseconds

/**
 * Get a bunny by ID
 */
export async function getBunny(bunnyId: string): Promise<Bunny> {
  const db = getDb();
  const bunnyRef = db.collection("bunnies").doc(bunnyId);
  const bunnyDoc = await bunnyRef.get();

  if (!bunnyDoc.exists) {
    throw new Error("Bunny not found");
  }

  const bunny = bunnyDoc.data() as Bunny;
  if (!bunny) {
    throw new Error("Bunny data is null");
  }

  return bunny;
}

/**
 * Get a bunny by ID within a transaction
 */
export async function getBunnyInTransaction(
  transaction: admin.firestore.Transaction,
  bunnyId: string
): Promise<Bunny> {
  const db = getDb();
  const bunnyRef = db.collection("bunnies").doc(bunnyId);
  const bunnyDoc = await transaction.get(bunnyRef);

  if (!bunnyDoc.exists) {
    throw new Error("Bunny not found");
  }

  const bunny = bunnyDoc.data() as Bunny;
  if (!bunny) {
    throw new Error("Bunny data is null");
  }

  return bunny;
}

/**
 * Get the base configuration
 */
export async function getConfiguration(): Promise<Configuration> {
  const db = getDb();
  const configRef = db.collection("configuration").doc("base");
  const configDoc = await configRef.get();

  if (!configDoc.exists) {
    throw new Error("Base configuration not found");
  }

  const config = configDoc.data() as Configuration;
  if (!config) {
    throw new Error("Configuration data is null");
  }

  return config;
}

/**
 * Update bunny happiness
 */
export async function updateBunnyHappiness(bunnyId: string, newHappiness: number): Promise<void> {
  const db = getDb();
  const bunnyRef = db.collection("bunnies").doc(bunnyId);
  await bunnyRef.update({ happiness: newHappiness });
}

/**
 * Update bunny within a transaction
 */
export async function updateBunnyInTransaction(
  transaction: admin.firestore.Transaction,
  bunnyId: string,
  updates: Partial<Bunny>
): Promise<void> {
  const db = getDb();
  const bunnyRef = db.collection("bunnies").doc(bunnyId);
  transaction.update(bunnyRef, updates);
}

/**
 * Update bunny playmates
 */
export async function updateBunnyPlayMates(bunnyId: string, playMates: string[]): Promise<void> {
  const db = getDb();
  const bunnyRef = db.collection("bunnies").doc(bunnyId);
  await bunnyRef.update({ playMates });
}

/**
 * Update event status within a transaction
 */
export async function updateEventStatusInTransaction(
  transaction: admin.firestore.Transaction,
  eventRef: admin.firestore.DocumentReference,
  status: EventStatus,
  additionalData?: any
): Promise<void> {
  const updateData: any = { status };

  if (status === 'finished') {
    updateData.processedAt = admin.firestore.FieldValue.serverTimestamp();
  } else if (status === 'error') {
    updateData.errorAt = admin.firestore.FieldValue.serverTimestamp();
  } else if (status === 'rejected') {
    updateData.rejectedAt = admin.firestore.FieldValue.serverTimestamp();
  }

  if (additionalData) {
    Object.assign(updateData, additionalData);
  }

  transaction.update(eventRef, updateData);
}

/**
 * Calculate new happiness with bounds checking
 */
export function calculateNewHappiness(currentHappiness: number, increase: number): number {
  return Math.min(10, Math.max(0, currentHappiness + increase));
}

/**
 * Check if two bunnies are playmates
 */
export function arePlayMates(bunny: Bunny, partnerBunnyId: string): boolean {
  return !!(bunny.playMates && bunny.playMates.includes(partnerBunnyId));
}

/**
 * Check if an event should be rejected based on timing
 */
export function shouldRejectEvent(
  lastEventTime: admin.firestore.Timestamp | undefined,
  currentTime: admin.firestore.Timestamp,
  minInterval: number
): boolean {
  if (!lastEventTime) {
    return false; // No previous event, so it's valid
  }

  const timeDiff = currentTime.toMillis() - lastEventTime.toMillis();
  return timeDiff < minInterval;
}

/**
 * Validate event timing for a bunny
 */
export function validateEventTiming(
  bunny: Bunny,
  eventType: 'feed' | 'play',
  currentTime: admin.firestore.Timestamp
): { isValid: boolean; reason?: string } {
  if (eventType === 'feed') {
    if (shouldRejectEvent(bunny.lastFeed, currentTime, MIN_FEED_INTERVAL)) {
      return {
        isValid: false,
        reason: `Bunny was fed too recently. Minimum interval: ${MIN_FEED_INTERVAL / 1000} seconds`
      };
    }
  } else if (eventType === 'play') {
    if (shouldRejectEvent(bunny.lastPlay, currentTime, MIN_PLAY_INTERVAL)) {
      return {
        isValid: false,
        reason: `Bunny was played with too recently. Minimum interval: ${MIN_PLAY_INTERVAL / 1000} seconds`
      };
    }
  }

  return { isValid: true };
}
