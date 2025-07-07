import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BunnyService } from './bunny';
import { ConfigurationService } from './configuration';
import { ActivityService } from './activity';
import { Bunny, BaseConfiguration } from './types';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private bunnyService = inject(BunnyService);
  private configurationService = inject(ConfigurationService);
  private activityService = inject(ActivityService);

  // Bunny data methods
  getBunnies(): Observable<Bunny[]> {
    return this.bunnyService.getBunnies();
  }

  addBunny(bunny: Omit<Bunny, 'id'>): Observable<string> {
    return this.bunnyService.addBunny(bunny);
  }

  updateBunny(id: string, updates: Partial<Bunny>): Observable<void> {
    return this.bunnyService.updateBunny(id, updates);
  }

  deleteBunny(id: string): Observable<void> {
    return this.bunnyService.deleteBunny(id);
  }

  updateBunnyHappiness(id: string, happiness: number): Observable<void> {
    return this.bunnyService.updateBunnyHappiness(id, happiness);
  }

  // Configuration methods
  getBaseConfiguration(): Observable<BaseConfiguration> {
    return this.configurationService.getBaseConfiguration();
  }

  updateBaseConfiguration(config: Partial<BaseConfiguration>): Observable<void> {
    return this.configurationService.updateBaseConfiguration(config);
  }

  // Activity methods
  feedBunny(bunnyId: string, mealType: 'lettuce' | 'carrot'): Observable<void> {
    return this.activityService.feedBunny(bunnyId, mealType);
  }

  playWithBunny(bunnyId: string): Observable<void> {
    return this.activityService.playWithBunny(bunnyId);
  }

  performActivity(bunnyId: string, activityType: keyof BaseConfiguration['activities']): Observable<void> {
    return this.activityService.performActivity(bunnyId, activityType);
  }
}

// Re-export types for backward compatibility
export type { Bunny, BaseConfiguration } from './types';
