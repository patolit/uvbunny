import * as admin from "firebase-admin";
import { Bunny, Configuration } from "./types";

const db = admin.firestore();

/**
 * Get a bunny by ID
 */
export async function getBunny(bunnyId: string): Promise<Bunny> {
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
 * Get the base configuration
 */
export async function getConfiguration(): Promise<Configuration> {
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
  const bunnyRef = db.collection("bunnies").doc(bunnyId);
  await bunnyRef.update({ happiness: newHappiness });
}

/**
 * Update bunny playmates
 */
export async function updateBunnyPlayMates(bunnyId: string, playMates: string[]): Promise<void> {
  const bunnyRef = db.collection("bunnies").doc(bunnyId);
  await bunnyRef.update({ playMates });
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
