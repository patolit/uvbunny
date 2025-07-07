import { Injectable, inject } from '@angular/core';
import { Firestore, doc, docData, setDoc, updateDoc } from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';
import { BaseConfiguration } from './types';

@Injectable({
  providedIn: 'root'
})
export class ConfigurationService {
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
    return new Observable(observer => {
      updateDoc(configRef, config)
        .then(() => {
          observer.next();
          observer.complete();
        })
        .catch(error => {
          observer.error(error);
        });
    });
  }
}
