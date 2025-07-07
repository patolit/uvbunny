/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {setGlobalOptions} from "firebase-functions";
import {onDocumentCreated} from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

admin.initializeApp();
const db = admin.firestore();

type EventStatus = "pending" | "processing" | "finished" | "error";

export const processBunnyEvent = onDocumentCreated("bunnieEvent/{eventId}", async (event) => {
  const snap = event.data;
  if (!snap) return;
    const eventRef = snap.ref;
    const eventData = snap.data();

    // Set status to 'processing'
    await eventRef.update({ status: "processing" as EventStatus });

    try {
      // Get bunny
      const bunnyRef = db.collection("bunnies").doc(eventData.bunnyId);
      const bunnyDoc = await bunnyRef.get();
      if (!bunnyDoc.exists) throw new Error("Bunny not found");
      const bunny = bunnyDoc.data();
      if (!bunny) throw new Error("Bunny data is null");

      // Get config
      const configRef = db.collection("configuration").doc("base");
      const configDoc = await configRef.get();
      if (!configDoc.exists) throw new Error("Base configuration not found");
      const config = configDoc.data();
      if (!config) throw new Error("Configuration data is null");

      let happinessIncrease = 0;
      if (eventData.eventType === "feed") {
        const feedType = eventData.eventData?.feedType;
        if (feedType === "carrot") {
          happinessIncrease = config.meals.carrot;
        } else if (feedType === "lettuce") {
          happinessIncrease = config.meals.lettuce;
        } else {
          throw new Error("Unknown feedType");
        }
      } else if (eventData.eventType === "play") {
        happinessIncrease = config.playScore;
      } else {
        throw new Error("Unknown eventType");
      }

      // Update bunny happiness
      const newHappiness = Math.min(10, bunny.happiness + happinessIncrease);
      await bunnyRef.update({ happiness: newHappiness });

      // Set event status to 'finished'
      await eventRef.update({
        status: "finished" as EventStatus,
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
        newHappiness,
      });
    } catch (error: any) {
      // Set event status to 'error'
      await eventRef.update({
        status: "error" as EventStatus,
        errorMessage: error.message || "Unknown error",
        errorAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.error("Error processing bunny event:", error);
    }
  });
