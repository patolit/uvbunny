import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Firestore, collection, addDoc } from '@angular/fire/firestore';
import { BunnyEvent } from './types';

@Injectable({
  providedIn: 'root'
})
export class ActivityService {
  private firestore = inject(Firestore);

  // Feed bunny with specific meal - now sends event
  feedBunny(bunnyId: string, mealType: 'lettuce' | 'carrot'): Observable<void> {
    const eventsCollection = collection(this.firestore, 'bunnieEvent');
    const eventData: Omit<BunnyEvent, 'id'> = {
      bunnyId: bunnyId,
      eventType: 'feed',
      eventData: {
        feedType: mealType
      },
      timestamp: new Date()
    };

    return new Observable(observer => {
      addDoc(eventsCollection, eventData)
        .then(() => {
          observer.next();
          observer.complete();
        })
        .catch(error => {
          observer.error(error);
        });
    });
  }

  // Play with bunny - now sends event with partner
  playWithBunny(bunnyId: string, partnerBunnyId: string): Observable<void> {
    const eventsCollection = collection(this.firestore, 'bunnieEvent');
    const eventData: Omit<BunnyEvent, 'id'> = {
      bunnyId: bunnyId,
      eventType: 'play',
      eventData: {
        playedWithBunnyId: partnerBunnyId
      },
      timestamp: new Date()
    };

    return new Observable(observer => {
      addDoc(eventsCollection, eventData)
        .then(() => {
          observer.next();
          observer.complete();
        })
        .catch(error => {
          observer.error(error);
        });
    });
  }

  // Perform any activity with bunny - now sends event
  performActivity(bunnyId: string, activityType: string): Observable<void> {
    // For now, we'll treat all activities as play events with self
    // You can extend this later if needed
    return this.playWithBunny(bunnyId, bunnyId);
  }
}
