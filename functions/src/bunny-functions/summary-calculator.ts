import { onDocumentWritten, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { onCall } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { SummaryData, BunnyEvent } from './types';

// Get Firestore instance - this will be initialized when the function is called
function getDb() {
  return admin.firestore();
}

/**
 * Cloud Function to calculate and maintain summary statistics
 * Triggered on bunny creation and bunny event completion
 */
export const calculateSummary = onDocumentWritten(
  'bunnies/{bunnyId}',
  async (event) => {
    try {
      const bunnyId = event.params.bunnyId;
      const beforeData = event.data?.before.data();
      const afterData = event.data?.after.data();

      // Check if this is a new bunny creation
      const isNewBunny = !beforeData && afterData;

      // Check if this is a bunny deletion
      const isDeletedBunny = beforeData && !afterData;

      if (isNewBunny) {
        console.log(`New bunny created: ${bunnyId}`);
        await updateSummaryForNewBunny(afterData);
      } else if (isDeletedBunny) {
        console.log(`Bunny deleted: ${bunnyId}`);
        await updateSummaryForDeletedBunny(beforeData);
      }
      // Note: Happiness updates are handled by bunny events, not direct bunny updates

    } catch (error) {
      console.error('Error in calculateSummary:', error);
      throw error;
    }
  }
);

/**
 * Cloud Function triggered when bunny events are finished
 */
export const updateSummaryOnEventCompletion = onDocumentUpdated(
  'bunnyEvents/{eventId}',
  async (event) => {
    try {
      const eventId = event.params.eventId;
      const beforeData = event.data?.before.data() as BunnyEvent;
      const afterData = event.data?.after.data() as BunnyEvent;

      // Only process when event status changes to "finished"
      if (beforeData.status !== 'finished' && afterData.status === 'finished') {
        console.log(`Event ${eventId} finished, updating summary`);
        await updateSummaryForEventCompletion(afterData);
      }

    } catch (error) {
      console.error('Error in updateSummaryOnEventCompletion:', error);
      throw error;
    }
  }
);

/**
 * Initialize summary data by calculating from all existing bunnies
 */
async function initializeSummaryData(): Promise<SummaryData> {
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
async function ensureSummaryDataExists(): Promise<void> {
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
async function updateSummaryForNewBunny(bunnyData: any): Promise<void> {
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

      const updatedSummary: SummaryData = {
        totalBunnies: newTotalBunnies,
        totalHappiness: newTotalHappiness,
        averageHappiness: newAverageHappiness,
        lastUpdated: admin.firestore.Timestamp.now()
      };

      transaction.update(summaryRef, updatedSummary as any);
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
async function updateSummaryForDeletedBunny(bunnyData: any): Promise<void> {
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

      const updatedSummary: SummaryData = {
        totalBunnies: newTotalBunnies,
        totalHappiness: newTotalHappiness,
        averageHappiness: newAverageHappiness,
        lastUpdated: admin.firestore.Timestamp.now()
      };

      transaction.update(summaryRef, updatedSummary as any);
      console.log(`Summary updated for deleted bunny: ${newTotalBunnies} bunnies, ${newAverageHappiness} average`);
    });
  } else {
    // Summary doesn't exist, initialize it (this will count all remaining bunnies)
    console.log('Summary does not exist, initializing with remaining bunnies');
    await ensureSummaryDataExists();
  }
}

/**
 * Update summary when a bunny event is completed
 */
async function updateSummaryForEventCompletion(event: BunnyEvent): Promise<void> {
  if (!event.newHappiness) {
    console.log('Event has no newHappiness value, skipping summary update');
    return;
  }

  const db = getDb();
  const summaryRef = db.collection('summaryData').doc('current');
  const summaryDoc = await summaryRef.get();

  // Check if summary exists
  if (summaryDoc.exists) {
    // Summary exists, so we can safely update the happiness
    await db.runTransaction(async (transaction) => {
      const currentSummary = summaryDoc.data() as SummaryData;

      // Get the bunny's previous happiness value
      const bunnyRef = db.collection('bunnies').doc(event.bunnyId);
      const bunnyDoc = await transaction.get(bunnyRef);

      if (!bunnyDoc.exists) {
        console.log(`Bunny ${event.bunnyId} not found, skipping summary update`);
        return;
      }

      const bunnyData = bunnyDoc.data();
      if (!bunnyData) {
        console.log(`Bunny ${event.bunnyId} data is null, skipping summary update`);
        return;
      }

      const previousHappiness = bunnyData.happiness || 0;
      const newHappiness = event.newHappiness!;

      // Calculate the difference in happiness
      const happinessDifference = newHappiness - previousHappiness;

      // Update summary with the happiness change
      const newTotalHappiness = currentSummary.totalHappiness + happinessDifference;
      const newAverageHappiness = Math.round((newTotalHappiness / currentSummary.totalBunnies) * 10) / 10;

      const updatedSummary: SummaryData = {
        totalBunnies: currentSummary.totalBunnies,
        totalHappiness: newTotalHappiness,
        averageHappiness: newAverageHappiness,
        lastUpdated: admin.firestore.Timestamp.now(),
        lastEventId: event.bunnyId
      };

      transaction.update(summaryRef, updatedSummary as any);
      console.log(`Summary updated for event completion: ${newAverageHappiness} average happiness (change: ${happinessDifference})`);
    });
  } else {
    // Summary doesn't exist, initialize it (this will calculate correct averages)
    console.log('Summary does not exist, initializing with all bunnies');
    await ensureSummaryDataExists();
  }
}

/**
 * Manual function to recalculate summary (for admin use)
 */
export const recalculateSummary = onCall(async (request) => {
  try {
    // Check if user is authenticated (optional security check)
    if (!request.auth) {
      throw new Error('User must be authenticated');
    }

    console.log('Manual summary recalculation requested');

    const summaryData = await initializeSummaryData();
    const db = getDb();
    const summaryRef = db.collection('summaryData').doc('current');
    await summaryRef.set(summaryData as any);

    return { success: true, message: 'Summary recalculated successfully' };
  } catch (error) {
    console.error('Error in recalculateSummary:', error);
    throw new Error('Failed to recalculate summary');
  }
});
