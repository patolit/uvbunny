import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { environment } from '../../environments/environment';

export interface Bunny {
  id?: string;
  name: string;
  breed: string;
  birthDate: string;
  happiness: number;
  lastFed: string;
  notes?: string;
}

export interface BaseConfiguration {
  id?: string;
  // Scoring system
  rewardScore: number;
  playScore: number;

  // Meal options with their happiness values
  meals: {
    lettuce: number;
    carrot: number;
  };

  // Activity types
  activities: {
    play: number;
    petting: number;
    grooming: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private app = initializeApp(environment.firebase);
  private db = getFirestore(this.app);

  constructor() {
    this.initializeBaseConfiguration();
  }

  // Initialize base configuration if it doesn't exist
  private async initializeBaseConfiguration(): Promise<void> {
    try {
      const configDoc = await getDoc(doc(this.db, 'configuration', 'base'));
      if (!configDoc.exists()) {
        const defaultConfig: Omit<BaseConfiguration, 'id'> = {
          rewardScore: 1,
          playScore: 2,
          meals: {
            lettuce: 1,
            carrot: 3
          },
          activities: {
            play: 2,
            petting: 1,
            grooming: 1
          }
        };
        await setDoc(doc(this.db, 'configuration', 'base'), defaultConfig);
      }
    } catch (error) {
      console.error('Error initializing base configuration:', error);
    }
  }

  // Get base configuration
  async getBaseConfiguration(): Promise<BaseConfiguration> {
    const configDoc = await getDoc(doc(this.db, 'configuration', 'base'));
    if (configDoc.exists()) {
      return { id: configDoc.id, ...configDoc.data() } as BaseConfiguration;
    }
    throw new Error('Base configuration not found');
  }

  // Update base configuration
  async updateBaseConfiguration(config: Partial<BaseConfiguration>): Promise<void> {
    const configRef = doc(this.db, 'configuration', 'base');
    await updateDoc(configRef, config);
  }

  // Bunny data methods
  async addBunny(bunny: Omit<Bunny, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(this.db, 'bunnies'), bunny);
    return docRef.id;
  }

  async getBunnies(): Promise<Bunny[]> {
    const querySnapshot = await getDocs(collection(this.db, 'bunnies'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Bunny));
  }

  async updateBunny(id: string, updates: Partial<Bunny>): Promise<void> {
    const bunnyRef = doc(this.db, 'bunnies', id);
    await updateDoc(bunnyRef, updates);
  }

  async deleteBunny(id: string): Promise<void> {
    const bunnyRef = doc(this.db, 'bunnies', id);
    await deleteDoc(bunnyRef);
  }

  async updateBunnyHappiness(id: string, happiness: number): Promise<void> {
    await this.updateBunny(id, {
      happiness,
      lastFed: new Date().toISOString()
    });
  }

  // Activity methods with scoring
  async feedBunny(bunnyId: string, mealType: 'lettuce' | 'carrot'): Promise<void> {
    const config = await this.getBaseConfiguration();
    const bunny = (await this.getBunnies()).find(b => b.id === bunnyId);

    if (bunny) {
      const happinessIncrease = config.meals[mealType];
      const newHappiness = Math.min(10, bunny.happiness + happinessIncrease);

      await this.updateBunny(bunnyId, {
        happiness: newHappiness,
        lastFed: new Date().toISOString()
      });
    }
  }

  async playWithBunny(bunnyId: string): Promise<void> {
    const config = await this.getBaseConfiguration();
    const bunny = (await this.getBunnies()).find(b => b.id === bunnyId);

    if (bunny) {
      const newHappiness = Math.min(10, bunny.happiness + config.playScore);
      await this.updateBunny(bunnyId, { happiness: newHappiness });
    }
  }

  async performActivity(bunnyId: string, activityType: keyof BaseConfiguration['activities']): Promise<void> {
    const config = await this.getBaseConfiguration();
    const bunny = (await this.getBunnies()).find(b => b.id === bunnyId);

    if (bunny) {
      const happinessIncrease = config.activities[activityType];
      const newHappiness = Math.min(10, bunny.happiness + happinessIncrease);
      await this.updateBunny(bunnyId, { happiness: newHappiness });
    }
  }
}
