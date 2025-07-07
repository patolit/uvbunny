import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import { EventStatus, BunnyEvent } from './types';
import {
  getBunny,
  getConfiguration,
  updateBunnyHappiness,
  updateBunnyPlayMates,
  calculateNewHappiness,
  arePlayMates,
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
      // Get bunny and config using utility functions
      const bunny = await getBunny(eventData.bunnyId);
      const config = await getConfiguration();

      let happinessIncrease = 0;
      let updates: any = {};

      if (eventData.eventType === 'feed') {
        const feedType = eventData.eventData?.feedType;
        if (feedType === 'carrot') {
          happinessIncrease = config.meals.carrot;
        } else if (feedType === 'lettuce') {
          happinessIncrease = config.meals.lettuce;
        } else {
          throw new Error('Unknown feedType');
        }
      } else if (eventData.eventType === 'play') {
        const partnerBunnyId = eventData.eventData?.playedWithBunnyId;
        if (!partnerBunnyId) throw new Error('No play partner specified');

        // Get partner bunny
        const partnerBunny = await getBunny(partnerBunnyId);

        // Check if they're already playmates (bonus points)
        const isExistingPlaymate = arePlayMates(bunny, partnerBunnyId);
        const isPartnerExistingPlaymate = arePlayMates(
          partnerBunny,
          eventData.bunnyId
        );

        // Calculate happiness increase (2x for existing playmates)
        happinessIncrease = isExistingPlaymate
          ? config.playScore * 2
          : config.playScore;

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

        // Update both bunnies' playMates
        await updateBunnyPlayMates(eventData.bunnyId, bunnyPlayMates);
        await updateBunnyPlayMates(partnerBunnyId, partnerPlayMates);

        // Also update partner's happiness (both bunnies get happiness from playing)
        const partnerHappinessIncrease = isPartnerExistingPlaymate
          ? config.playScore * 2
          : config.playScore;
        const newPartnerHappiness = calculateNewHappiness(
          partnerBunny.happiness,
          partnerHappinessIncrease
        );
        await updateBunnyHappiness(partnerBunnyId, newPartnerHappiness);

        // Store playmate info in event for tracking
        updates.playmateBonus = isExistingPlaymate;
        updates.partnerBunnyId = partnerBunnyId;
        updates.partnerHappinessIncrease = partnerHappinessIncrease;
        updates.newPartnerHappiness = newPartnerHappiness;
      } else {
        throw new Error('Unknown eventType');
      }

      // Update bunny happiness
      const newHappiness = calculateNewHappiness(
        bunny.happiness,
        happinessIncrease
      );
      await updateBunnyHappiness(eventData.bunnyId, newHappiness);

      // Set event status to 'finished'
      await eventRef.update({
        status: 'finished' as EventStatus,
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
        newHappiness,
        ...updates,
      });
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
