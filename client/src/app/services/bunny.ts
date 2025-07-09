import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, doc, addDoc, updateDoc, deleteDoc, query, orderBy, limit, startAfter, getDocs, QueryDocumentSnapshot, DocumentData } from '@angular/fire/firestore';
import { Observable, map, from } from 'rxjs';
import { Bunny, InfiniteScrollState, InfiniteScrollResult } from '../types';

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

  // Infinite scroll methods
  getBunniesInfinite(batchSize: number = 5, lastDocument?: QueryDocumentSnapshot<DocumentData>): Observable<InfiniteScrollResult> {
    const bunniesCollection = collection(this.firestore, 'bunnies');

    let q = query(
      bunniesCollection,
      orderBy('name'),
      limit(batchSize)
    );

    if (lastDocument) {
      q = query(q, startAfter(lastDocument));
    }

    return from(getDocs(q)).pipe(
      map(snapshot => {
        const bunnies = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Bunny[];

        const lastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : undefined;
        // hasMore is true if we got exactly the batch size (meaning there might be more)
        // or if we have a lastDocument but got fewer results than requested
        const hasMore = snapshot.docs.length === batchSize;

        return {
          bunnies,
          lastDocument: lastDoc,
          hasMore,
          totalLoaded: bunnies.length
        };
      })
    );
  }

  getBunniesForChart(batchSize: number = 15, lastDocument?: QueryDocumentSnapshot<DocumentData>): Observable<InfiniteScrollResult> {
    const bunniesCollection = collection(this.firestore, 'bunnies');

    let q = query(
      bunniesCollection,
      orderBy('name'),
      limit(batchSize)
    );

    if (lastDocument) {
      q = query(q, startAfter(lastDocument));
    }

    return from(getDocs(q)).pipe(
      map(snapshot => {
        const bunnies = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Bunny[];

        const lastDoc = snapshot.docs[snapshot.docs.length - 1];
        const hasMore = snapshot.docs.length === batchSize;

        return {
          bunnies,
          lastDocument: lastDoc,
          hasMore,
          totalLoaded: bunnies.length
        };
      })
    );
  }

  getBunniesForPen(batchSize: number = 50, lastDocument?: QueryDocumentSnapshot<DocumentData>): Observable<InfiniteScrollResult> {
    const bunniesCollection = collection(this.firestore, 'bunnies');

    let q = query(
      bunniesCollection,
      orderBy('name'),
      limit(batchSize)
    );

    if (lastDocument) {
      q = query(q, startAfter(lastDocument));
    }

    return from(getDocs(q)).pipe(
      map(snapshot => {
        const bunnies = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Bunny[];

        const lastDoc = snapshot.docs[snapshot.docs.length - 1];
        const hasMore = snapshot.docs.length === batchSize;

        return {
          bunnies,
          lastDocument: lastDoc,
          hasMore,
          totalLoaded: bunnies.length
        };
      })
    );
  }

  // Search bunnies with infinite scroll (backend filtering)
  searchBunniesInfinite(
    searchTerm: string,
    batchSize: number = 20,
    lastDocument?: QueryDocumentSnapshot<DocumentData>
  ): Observable<InfiniteScrollResult> {
    const bunniesCollection = collection(this.firestore, 'bunnies');

    // Note: This is a simplified search. For production, consider using
    // Firestore's full-text search or Algolia for better search capabilities
    let q = query(
      bunniesCollection,
      orderBy('name'),
      limit(batchSize)
    );

    if (lastDocument) {
      q = query(q, startAfter(lastDocument));
    }

    return from(getDocs(q)).pipe(
      map(snapshot => {
        const allBunnies = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Bunny[];

        // Filter on client side for now (will be moved to backend)
        const searchLower = searchTerm.toLowerCase().trim();
        const filteredBunnies = allBunnies.filter(bunny =>
          bunny.name.toLowerCase().includes(searchLower) ||
          bunny.color.toLowerCase().includes(searchLower) ||
          bunny.happiness.toString().includes(searchLower) ||
          bunny.birthDate.toLowerCase().includes(searchLower)
        );

        const lastDoc = snapshot.docs[snapshot.docs.length - 1];
        const hasMore = snapshot.docs.length === batchSize;

        return {
          bunnies: filteredBunnies,
          lastDocument: lastDoc,
          hasMore,
          totalLoaded: filteredBunnies.length
        };
      })
    );
  }
}
