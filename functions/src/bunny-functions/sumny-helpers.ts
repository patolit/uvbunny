import * as admin from 'firebase-admin';
import { BunnyEvent, SummaryData } from './types';

// Get Firestore instance
function getDb() {
  return admin.firestore();
}

/**
 * Update summary when a bunny event is completed
 */
export async function updateSummaryForEventCompletion(event: BunnyEvent): Promise<void> {
  if (!event.deltaHappiness) {
    console.log('Event has no deltaHappiness value, skipping summary update');
    return;
  }

  console.log(`Event ${event.bunnyId} completed with delta happiness: ${event.deltaHappiness}, updating summary`);

  const db = getDb();
  const summaryRef = db.collection('summaryData').doc('current');
  const summaryDoc = await summaryRef.get();

  // Check if summary exists
  if (summaryDoc.exists) {
    // Summary exists, so we can safely update using delta values
    await db.runTransaction(async (transaction) => {
      const currentSummary = summaryDoc.data() as SummaryData;

      // Calculate total delta happiness (main bunny + partner bunny if applicable)
      let totalDeltaHappiness = event.deltaHappiness || 0;
      if (event.partnerDeltaHappiness) {
        totalDeltaHappiness += event.partnerDeltaHappiness;
        console.log(`Including partner delta: ${event.partnerDeltaHappiness}, total delta: ${totalDeltaHappiness}`);
      }

      // Update summary with the delta happiness
      const newTotalHappiness = currentSummary.totalHappiness + totalDeltaHappiness;
      const newAverageHappiness = Math.round((newTotalHappiness / currentSummary.totalBunnies) * 10) / 10;

      const updatedSummary: any = {
        totalBunnies: currentSummary.totalBunnies, // No change in bunny count
        totalHappiness: newTotalHappiness,
        averageHappiness: newAverageHappiness,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        lastEventId: event.bunnyId
      };

      transaction.update(summaryRef, updatedSummary as any);
      console.log(`Summary updated for event completion: ${newAverageHappiness} average happiness (delta: ${totalDeltaHappiness}, total: ${newTotalHappiness})`);
    });
  } else {
    // Summary doesn't exist, initialize it (this will calculate correct averages)
    console.log('Summary does not exist, initializing with all bunnies');
    await ensureSummaryDataExists();
  }
}

/**
 * Initialize summary data by calculating from all existing bunnies
 */
export async function initializeSummaryData(): Promise<SummaryData> {
  console.log('Initializing summary data...');

  const db = getDb();
  const bunniesSnapshot = await db.collection('bunnies').get();
  let totalBunnies = 0;
  let totalHappiness = 0;

  bunniesSnapshot.forEach(doc => {
    const bunny = doc.data();
    totalBunnies++;
    totalHappiness += bunny.happiness || 0;
  });

  const averageHappiness = totalBunnies > 0 ? totalHappiness / totalBunnies : 0;

  const summaryData: SummaryData = {
    totalBunnies,
    totalHappiness,
    averageHappiness: Math.round(averageHappiness * 10) / 10, // Round to 1 decimal place
    lastUpdated: admin.firestore.Timestamp.now()
  };

  console.log(`Summary initialized: ${totalBunnies} bunnies, ${averageHappiness} average happiness`);
  return summaryData;
}

/**
 * Check if summary data exists and create it if it doesn't
 */
export async function ensureSummaryDataExists(): Promise<void> {
  const db = getDb();
  const summaryRef = db.collection('summaryData').doc('current');
  const summaryDoc = await summaryRef.get();

  if (!summaryDoc.exists) {
    console.log('Summary data does not exist, initializing...');
    const summaryData = await initializeSummaryData();
    await summaryRef.set(summaryData as any);
    console.log('Summary data initialized successfully');
  }
}

/**
 * Update summary when a new bunny is created
 */
export async function updateSummaryForNewBunny(bunnyData: any): Promise<void> {
  const bunnyHappiness = bunnyData.happiness || 0;

  const db = getDb();
  const summaryRef = db.collection('summaryData').doc('current');
  const summaryDoc = await summaryRef.get();

  // Check if summary already exists
  if (summaryDoc.exists) {
    // Summary exists, so we can safely increment the counts
    await db.runTransaction(async (transaction) => {
      const currentSummary = summaryDoc.data() as SummaryData;

      const newTotalBunnies = currentSummary.totalBunnies + 1;
      const newTotalHappiness = currentSummary.totalHappiness + bunnyHappiness;
      const newAverageHappiness = Math.round((newTotalHappiness / newTotalBunnies) * 10) / 10;

      const updatedSummary: any = {
        totalBunnies: newTotalBunnies,
        totalHappiness: newTotalHappiness,
        averageHappiness: newAverageHappiness,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      };

      transaction.update(summaryRef, updatedSummary);
      console.log(`Summary updated for new bunny: ${newTotalBunnies} bunnies, ${newAverageHappiness} average`);
    });
  } else {
    // Summary doesn't exist, initialize it (this will count all bunnies including the new one)
    console.log('Summary does not exist, initializing with all bunnies');
    await ensureSummaryDataExists();
  }
}

/**
 * Update summary when a bunny is deleted
 */
export async function updateSummaryForDeletedBunny(bunnyData: any): Promise<void> {
  const bunnyHappiness = bunnyData.happiness || 0;

  const db = getDb();
  const summaryRef = db.collection('summaryData').doc('current');
  const summaryDoc = await summaryRef.get();

  // Check if summary exists
  if (summaryDoc.exists) {
    // Summary exists, so we can safely decrement the counts
    await db.runTransaction(async (transaction) => {
      const currentSummary = summaryDoc.data() as SummaryData;

      const newTotalBunnies = Math.max(0, currentSummary.totalBunnies - 1);
      const newTotalHappiness = Math.max(0, currentSummary.totalHappiness - bunnyHappiness);
      const newAverageHappiness = newTotalBunnies > 0
        ? Math.round((newTotalHappiness / newTotalBunnies) * 10) / 10
        : 0;

      const updatedSummary: any = {
        totalBunnies: newTotalBunnies,
        totalHappiness: newTotalHappiness,
        averageHappiness: newAverageHappiness,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      };

      transaction.update(summaryRef, updatedSummary);
      console.log(`Summary updated for deleted bunny: ${newTotalBunnies} bunnies, ${newAverageHappiness} average`);
    });
  } else {
    // Summary doesn't exist, initialize it (this will count all remaining bunnies)
    console.log('Summary does not exist, initializing with remaining bunnies');
    await ensureSummaryDataExists();
  }
}
