import { onDocumentWritten, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { onCall } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { SummaryData, BunnyEvent } from './types';
import {
  initializeSummaryData,
  ensureSummaryDataExists,
  updateSummaryForNewBunny,
  updateSummaryForDeletedBunny,
  updateSummaryForEventCompletion
} from './sumny-helpers';

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
  'bunnieEvent/{eventId}',
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
