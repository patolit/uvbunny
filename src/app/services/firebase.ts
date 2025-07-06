import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, doc, docData, addDoc, updateDoc, deleteDoc, setDoc } from '@angular/fire/firestore';
import { Observable, from, map, switchMap, of } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Bunny {
  id?: string;
  name: string;
  breed: string;
  birthDate: string;
  happiness: number;
  lastFed: string;
  notes?: string;
  color?: string;
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
  private firestore = inject(Firestore);

  constructor() {
    this.initializeBaseConfiguration();
  }

  // Initialize base configuration if it doesn't exist
  private async initializeBaseConfiguration(): Promise<void> {
    try {
      const configDoc = doc(this.firestore, 'configuration', 'base');
      const configData = await docData(configDoc).toPromise();

      if (!configData) {
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
        await setDoc(configDoc, defaultConfig);
      }
    } catch (error) {
      console.error('Error initializing base configuration:', error);
    }
  }

  // Get base configuration (Observable-based)
  getBaseConfiguration(): Observable<BaseConfiguration> {
    const configDoc = doc(this.firestore, 'configuration', 'base');
    return docData(configDoc).pipe(
      map(config => ({ id: 'base', ...config } as BaseConfiguration))
    );
  }

  // Update base configuration
  updateBaseConfiguration(config: Partial<BaseConfiguration>): Observable<void> {
    const configRef = doc(this.firestore, 'configuration', 'base');
    return from(updateDoc(configRef, config));
  }

  // Bunny data methods with real-time updates
  getBunnies(): Observable<Bunny[]> {
    const bunniesCollection = collection(this.firestore, 'bunnies');
    return collectionData(bunniesCollection, { idField: 'id' }).pipe(
      map(bunnies => bunnies as Bunny[])
    );
  }

  // Add bunny
  addBunny(bunny: Omit<Bunny, 'id'>): Observable<string> {
    const bunniesCollection = collection(this.firestore, 'bunnies');
    return from(addDoc(bunniesCollection, bunny)).pipe(
      map(docRef => docRef.id)
    );
  }

  // Update bunny
  updateBunny(id: string, updates: Partial<Bunny>): Observable<void> {
    const bunnyRef = doc(this.firestore, 'bunnies', id);
    return from(updateDoc(bunnyRef, updates));
  }

  // Delete bunny
  deleteBunny(id: string): Observable<void> {
    const bunnyRef = doc(this.firestore, 'bunnies', id);
    return from(deleteDoc(bunnyRef));
  }

  // Update bunny happiness
  updateBunnyHappiness(id: string, happiness: number): Observable<void> {
    return this.updateBunny(id, {
      happiness,
      lastFed: new Date().toISOString()
    });
  }

  // Activity methods with scoring
  feedBunny(bunnyId: string, mealType: 'lettuce' | 'carrot'): Observable<void> {
    return this.getBaseConfiguration().pipe(
      switchMap(config =>
        this.getBunnies().pipe(
          map(bunnies => bunnies.find(b => b.id === bunnyId)),
          switchMap(bunny => {
            if (bunny) {
              const happinessIncrease = config.meals[mealType];
              const newHappiness = Math.min(10, bunny.happiness + happinessIncrease);
              return this.updateBunny(bunnyId, {
                happiness: newHappiness,
                lastFed: new Date().toISOString()
              });
            }
            return of(void 0);
          })
        )
      )
    );
  }

  playWithBunny(bunnyId: string): Observable<void> {
    return this.getBaseConfiguration().pipe(
      switchMap(config =>
        this.getBunnies().pipe(
          map(bunnies => bunnies.find(b => b.id === bunnyId)),
          switchMap(bunny => {
            if (bunny) {
              const newHappiness = Math.min(10, bunny.happiness + config.playScore);
              return this.updateBunny(bunnyId, { happiness: newHappiness });
            }
            return of(void 0);
          })
        )
      )
    );
  }

  performActivity(bunnyId: string, activityType: keyof BaseConfiguration['activities']): Observable<void> {
    return this.getBaseConfiguration().pipe(
      switchMap(config =>
        this.getBunnies().pipe(
          map(bunnies => bunnies.find(b => b.id === bunnyId)),
          switchMap(bunny => {
            if (bunny) {
              const happinessIncrease = config.activities[activityType];
              const newHappiness = Math.min(10, bunny.happiness + happinessIncrease);
              return this.updateBunny(bunnyId, { happiness: newHappiness });
            }
            return of(void 0);
          })
        )
      )
    );
  }
}
