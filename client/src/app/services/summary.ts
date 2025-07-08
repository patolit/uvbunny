import { Injectable, inject } from '@angular/core';
import { Firestore, doc, getDoc, onSnapshot } from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { SummaryData } from './types';

@Injectable({
  providedIn: 'root'
})
export class SummaryService {
  private firestore = inject(Firestore);

  /**
   * Get the current summary data from Firestore
   * @returns Observable of SummaryData or null if not found
   */
  getSummaryData(): Observable<SummaryData | null> {
    const summaryDoc = doc(this.firestore, 'summaryData', 'current');

    return from(getDoc(summaryDoc)).pipe(
      map(docSnapshot => {
        if (docSnapshot.exists()) {
          return docSnapshot.data() as SummaryData;
        }
        return null;
      })
    );
  }

  /**
   * Get the total number of bunnies from summary data
   * @returns Observable of total bunnies count
   */
  getTotalBunnies(): Observable<number> {
    return this.getSummaryData().pipe(
      map(summary => summary?.totalBunnies || 0)
    );
  }

  /**
   * Get real-time updates of summary data
   * @returns Observable that emits whenever summary data changes
   */
  getSummaryDataRealtime(): Observable<SummaryData | null> {
    const summaryDoc = doc(this.firestore, 'summaryData', 'current');

    return new Observable<SummaryData | null>(observer => {
      const unsubscribe = onSnapshot(summaryDoc, (docSnapshot) => {
        if (docSnapshot.exists()) {
          observer.next(docSnapshot.data() as SummaryData);
        } else {
          observer.next(null);
        }
      }, (error) => {
        observer.error(error);
      });

      // Return cleanup function
      return () => unsubscribe();
    });
  }
}
