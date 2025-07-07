import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, doc, addDoc, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';
import { Bunny } from './types';

@Injectable({
  providedIn: 'root'
})
export class BunnyService {
  private firestore = inject(Firestore);

  // Get all bunnies with real-time updates
  getBunnies(): Observable<Bunny[]> {
    const bunniesCollection = collection(this.firestore, 'bunnies');
    return collectionData(bunniesCollection, { idField: 'id' }).pipe(
      map(bunnies => bunnies as Bunny[])
    );
  }

  // Add a new bunny
  addBunny(bunny: Omit<Bunny, 'id'>): Observable<string> {
    const bunniesCollection = collection(this.firestore, 'bunnies');
    return new Observable(observer => {
      addDoc(bunniesCollection, bunny)
        .then(docRef => {
          observer.next(docRef.id);
          observer.complete();
        })
        .catch(error => {
          observer.error(error);
        });
    });
  }

  // Update a bunny
  updateBunny(id: string, updates: Partial<Bunny>): Observable<void> {
    const bunnyRef = doc(this.firestore, 'bunnies', id);
    return new Observable(observer => {
      updateDoc(bunnyRef, updates)
        .then(() => {
          observer.next();
          observer.complete();
        })
        .catch(error => {
          observer.error(error);
        });
    });
  }

  // Delete a bunny
  deleteBunny(id: string): Observable<void> {
    const bunnyRef = doc(this.firestore, 'bunnies', id);
    return new Observable(observer => {
      deleteDoc(bunnyRef)
        .then(() => {
          observer.next();
          observer.complete();
        })
        .catch(error => {
          observer.error(error);
        });
    });
  }

  // Update bunny happiness
  updateBunnyHappiness(id: string, happiness: number): Observable<void> {
    return this.updateBunny(id, { happiness });
  }
}
