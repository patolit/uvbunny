import { Injectable, inject } from '@angular/core';
import { Observable, switchMap, map, of } from 'rxjs';
import { ConfigurationService } from './configuration';
import { BunnyService } from './bunny';
import { BaseConfiguration } from './types';

@Injectable({
  providedIn: 'root'
})
export class ActivityService {
  private configurationService = inject(ConfigurationService);
  private bunnyService = inject(BunnyService);

  // Feed bunny with specific meal
  feedBunny(bunnyId: string, mealType: 'lettuce' | 'carrot'): Observable<void> {
    return this.configurationService.getBaseConfiguration().pipe(
      switchMap(config =>
        this.bunnyService.getBunnies().pipe(
          map(bunnies => bunnies.find(b => b.id === bunnyId)),
          switchMap(bunny => {
            if (bunny) {
              const happinessIncrease = config.meals[mealType];
              const newHappiness = Math.min(10, bunny.happiness + happinessIncrease);
              return this.bunnyService.updateBunny(bunnyId, {
                happiness: newHappiness
              });
            }
            return of(void 0);
          })
        )
      )
    );
  }

  // Play with bunny
  playWithBunny(bunnyId: string): Observable<void> {
    return this.configurationService.getBaseConfiguration().pipe(
      switchMap(config =>
        this.bunnyService.getBunnies().pipe(
          map(bunnies => bunnies.find(b => b.id === bunnyId)),
          switchMap(bunny => {
            if (bunny) {
              const newHappiness = Math.min(10, bunny.happiness + config.playScore);
              return this.bunnyService.updateBunny(bunnyId, { happiness: newHappiness });
            }
            return of(void 0);
          })
        )
      )
    );
  }

  // Perform any activity with bunny
  performActivity(bunnyId: string, activityType: keyof BaseConfiguration['activities']): Observable<void> {
    return this.configurationService.getBaseConfiguration().pipe(
      switchMap(config =>
        this.bunnyService.getBunnies().pipe(
          map(bunnies => bunnies.find(b => b.id === bunnyId)),
          switchMap(bunny => {
            if (bunny) {
              const happinessIncrease = config.activities[activityType];
              const newHappiness = Math.min(10, bunny.happiness + happinessIncrease);
              return this.bunnyService.updateBunny(bunnyId, { happiness: newHappiness });
            }
            return of(void 0);
          })
        )
      )
    );
  }
}
