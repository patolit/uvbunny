import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Firestore, doc, docData, getDoc } from '@angular/fire/firestore';

export interface SummaryData {
  totalBunnies: number;
  totalHappiness: number;
  averageHappiness: number;
  lastUpdated: any; // Firebase Timestamp
  lastEventId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SummaryService {
  constructor(private firestore: Firestore) {}

  /**
   * Get real-time summary data from Firebase
   */
  getSummaryData(): Observable<SummaryData | null> {
    const summaryRef = doc(this.firestore, 'summaryData', 'current');
    return docData(summaryRef) as Observable<SummaryData | null>;
  }

  /**
   * Get summary data as a promise (for one-time fetching)
   */
  async getSummaryDataOnce(): Promise<SummaryData | null> {
    const summaryRef = doc(this.firestore, 'summaryData', 'current');
    const snapshot = await getDoc(summaryRef);
    return snapshot.exists() ? snapshot.data() as SummaryData : null;
  }
}
