import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

const db = admin.firestore();

// Process bunny events and update happiness
export const processBunnyEvent = functions.firestore
  .document('bunnieEvent/{eventId}')
  .onCreate(async (snap, context) => {
    const eventData = snap.data();
    const eventId = context.params.eventId;

    try {
      console.log(`Processing event ${eventId}:`, eventData);

      // Get the bunny
      const bunnyRef = db.collection('bunnies').doc(eventData.bunnyId);
      const bunnyDoc = await bunnyRef.get();

      if (!bunnyDoc.exists) {
        console.error(`Bunny ${eventData.bunnyId} not found`);
        return;
      }

      const bunny = bunnyDoc.data();
      if (!bunny) {
        console.error(`Bunny data is null for ${eventData.bunnyId}`);
        return;
      }

      // Get configuration
      const configRef = db.collection('configuration').doc('base');
      const configDoc = await configRef.get();

      if (!configDoc.exists) {
        console.error('Base configuration not found');
        return;
      }

      const config = configDoc.data();
      if (!config) {
        console.error('Configuration data is null');
        return;
      }

      let happinessIncrease = 0;

      // Calculate happiness increase based on event type
      if (eventData.eventType === 'feed') {
        const feedType = eventData.eventData.feedType;
        if (feedType === 'carrot') {
          happinessIncrease = config.meals.carrot;
        } else if (feedType === 'lettuce') {
          happinessIncrease = config.meals.lettuce;
        }
      } else if (eventData.eventType === 'play') {
        happinessIncrease = config.playScore;
      }

      // Calculate new happiness (max 10)
      const newHappiness = Math.min(10, bunny.happiness + happinessIncrease);

      // Update bunny happiness
      await bunnyRef.update({
        happiness: newHappiness
      });

      console.log(`Updated bunny ${eventData.bunnyId} happiness from ${bunny.happiness} to ${newHappiness}`);

      // Optionally mark event as processed
      await snap.ref.update({
        processed: true,
        processedAt: admin.firestore.FieldValue.serverTimestamp()
      });

    } catch (error) {
      console.error('Error processing bunny event:', error);
      throw error;
    }
  });

// HTTP function to manually trigger event processing (optional)
export const processAllUnprocessedEvents = functions.https.onRequest(async (req, res) => {
  try {
    const unprocessedEvents = await db.collection('bunnieEvent')
      .where('processed', '==', false)
      .get();

    const batch = db.batch();
    let processedCount = 0;

    for (const doc of unprocessedEvents.docs) {
      // Process each event (you could reuse the logic from above)
      batch.update(doc.ref, {
        processed: true,
        processedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      processedCount++;
    }

    await batch.commit();
    res.json({ success: true, processedCount });
  } catch (error) {
    console.error('Error processing events:', error);
    res.status(500).json({ error: 'Failed to process events' });
  }
});
