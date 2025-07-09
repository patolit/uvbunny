import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import { EventStatus, BunnyEvent } from './types';

// Configuration for idle events
const IDLE_HAPPINESS_DECREASE = 1; // Decrease happiness by 1 point for being idle
import {
  getBunnyInTransaction,
  getConfiguration,
  updateBunnyInTransaction,
  updateEventStatusInTransaction,
  calculateNewHappiness,
  arePlayMates,
  validateEventTiming,
} from './utils';

export const processBunnyEvent = onDocumentCreated(
  'bunnieEvent/{eventId}',
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const eventRef = snap.ref;
    const eventData = snap.data() as BunnyEvent;

    // Set status to 'processing'
    await eventRef.update({ status: 'processing' as EventStatus });

    try {
      // Get configuration (can be outside transaction as it's read-only)
      const config = await getConfiguration();
      const currentTime = admin.firestore.Timestamp.now();

      // Process event within a transaction for atomicity
      await admin.firestore().runTransaction(async (transaction) => {
        // Read bunny data within transaction
        const bunny = await getBunnyInTransaction(transaction, eventData.bunnyId);

        // Validate event timing (only for feed and play events, not for system-generated idle events)
        if (eventData.eventType === 'feed' || eventData.eventType === 'play') {
          const validation = validateEventTiming(bunny, eventData.eventType, currentTime);
          if (!validation.isValid) {
            await updateEventStatusInTransaction(transaction, eventRef, 'rejected', {
              rejectionReason: validation.reason
            });
            return; // Exit transaction - event is rejected
          }
        }

        let happinessIncrease = 0;
        let bunnyUpdates: any = {};
        let partnerBunnyUpdates: any = {};
        let isExistingPlaymate = false;
        let partnerHappinessIncrease = 0;
        let partnerBunny: any = null; // Declare partnerBunny at this scope

        if (eventData.eventType === 'feed') {
          const feedType = eventData.eventData?.feedType;
          if (feedType === 'carrot') {
            happinessIncrease = config.meals.carrot;
          } else if (feedType === 'lettuce') {
            happinessIncrease = config.meals.lettuce;
          } else {
            throw new Error('Unknown feedType');
          }

          // Update bunny with new happiness and lastFeed timestamp
          const newHappiness = calculateNewHappiness(bunny.happiness, happinessIncrease);
          bunnyUpdates = {
            happiness: newHappiness,
            lastFeed: currentTime
          };

        } else if (eventData.eventType === 'play') {
          const partnerBunnyId = eventData.eventData?.playedWithBunnyId;
          if (!partnerBunnyId) throw new Error('No play partner specified');

          // Get partner bunny within transaction
          partnerBunny = await getBunnyInTransaction(transaction, partnerBunnyId);

          // Validate partner bunny timing
          const partnerValidation = validateEventTiming(partnerBunny, 'play', currentTime);
          if (!partnerValidation.isValid) {
            await updateEventStatusInTransaction(transaction, eventRef, 'rejected', {
              rejectionReason: `Partner bunny ${partnerBunny.name}: ${partnerValidation.reason}`
            });
            return; // Exit transaction - event is rejected
          }

          // Check if they're already playmates (bonus points)
          const isExistingPlaymate = arePlayMates(bunny, partnerBunnyId);
          const isPartnerExistingPlaymate = arePlayMates(partnerBunny, eventData.bunnyId);

          // Calculate happiness increase (2x for existing playmates)
          happinessIncrease = isExistingPlaymate ? config.playScore * 2 : config.playScore;
          const partnerHappinessIncrease = isPartnerExistingPlaymate ? config.playScore * 2 : config.playScore;

          // Update playMates arrays for both bunnies
          const bunnyPlayMates = bunny.playMates || [];
          const partnerPlayMates = partnerBunny.playMates || [];

          // Add partner to bunny's playMates if not already there
          if (!bunnyPlayMates.includes(partnerBunnyId)) {
            bunnyPlayMates.push(partnerBunnyId);
          }

          // Add bunny to partner's playMates if not already there
          if (!partnerPlayMates.includes(eventData.bunnyId)) {
            partnerPlayMates.push(eventData.bunnyId);
          }

          // Calculate new happiness for both bunnies
          const newBunnyHappiness = calculateNewHappiness(bunny.happiness, happinessIncrease);
          const newPartnerHappiness = calculateNewHappiness(partnerBunny.happiness, partnerHappinessIncrease);

          // Prepare updates for both bunnies
          bunnyUpdates = {
            happiness: newBunnyHappiness,
            playMates: bunnyPlayMates,
            lastPlay: currentTime
          };

          partnerBunnyUpdates = {
            happiness: newPartnerHappiness,
            playMates: partnerPlayMates,
            lastPlay: currentTime
          };

        } else if (eventData.eventType === 'idle') {
          // Idle events decrease happiness by 1 point
          happinessIncrease = -IDLE_HAPPINESS_DECREASE; // Negative value for decrease

          // Update bunny with new happiness (no timestamp updates for idle)
          const newHappiness = calculateNewHappiness(bunny.happiness, happinessIncrease);
          bunnyUpdates = {
            happiness: newHappiness
          };

        } else {
          throw new Error('Unknown eventType');
        }

        // Store original happiness values for delta calculation
        const originalBunnyHappiness = bunny.happiness;
        const originalPartnerHappiness = eventData.eventType === 'play' ? partnerBunny.happiness : 0;

        // Apply all updates within the transaction
        await updateBunnyInTransaction(transaction, eventData.bunnyId, bunnyUpdates);

        if (Object.keys(partnerBunnyUpdates).length > 0) {
          const partnerBunnyId = eventData.eventData?.playedWithBunnyId!;
          await updateBunnyInTransaction(transaction, partnerBunnyId, partnerBunnyUpdates);
        }

        // Calculate delta happiness using original values
        const deltaHappiness = bunnyUpdates.happiness - originalBunnyHappiness;

        // Update event status to 'finished' with all relevant data
        const eventUpdateData: any = {
          newHappiness: bunnyUpdates.happiness,
          deltaHappiness: deltaHappiness
        };

        if (eventData.eventType === 'play') {
          const partnerDeltaHappiness = partnerBunnyUpdates.happiness - originalPartnerHappiness;

          eventUpdateData.playmateBonus = isExistingPlaymate;
          eventUpdateData.partnerBunnyId = eventData.eventData?.playedWithBunnyId;
          eventUpdateData.partnerHappinessIncrease = partnerHappinessIncrease;
          eventUpdateData.newPartnerHappiness = partnerBunnyUpdates.happiness;
          eventUpdateData.partnerDeltaHappiness = partnerDeltaHappiness;
        }

        await updateEventStatusInTransaction(transaction, eventRef, 'finished', eventUpdateData);
      });

      // Note: Summary will be updated automatically by the updateSummaryOnEventCompletion trigger
      // when the event status changes to 'finished'

    } catch (error: any) {
      // Set event status to 'error'
      await eventRef.update({
        status: 'error' as EventStatus,
        errorMessage: error.message || 'Unknown error',
        errorAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.error('Error processing bunny event:', error);
    }
  }
);
