import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { FirebaseService, Bunny, SummaryData } from '../../services/firebase';
import { BunnyViewer } from './bunny-viewer/bunny-viewer';
import { AddBunnyModal } from './add-bunny-modal/add-bunny-modal';
import { Observable, Subscription, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { BunnyService } from '../../services/bunny';
import { InfiniteScrollState, InfiniteScrollResult } from '../../types';
import { QueryDocumentSnapshot, DocumentData } from '@angular/fire/firestore';

@Component({
  selector: 'app-home-page',
  imports: [CommonModule, FormsModule, BunnyViewer, AddBunnyModal],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss'
})
export class HomePage implements OnInit, OnDestroy {
  bunnies$: Observable<Bunny[]>;
  loading = true;
  error = '';
  showAddModal = false;
  initialView: 'chart' | 'table' | 'pen' = 'chart';

  // Pagination state
  private paginationState: InfiniteScrollState = {
    hasMore: true,
    isLoading: false,
    loadedCount: 0
  };
  private allBunnies: Bunny[] = [];
  private bunniesSubject = new BehaviorSubject<Bunny[]>([]);
  private subscription = new Subscription();
  private totalAvailableBunnies = 0;
  private summaryAverageHappiness = 0;

  constructor(
    private firebaseService: FirebaseService,
    private bunnyService: BunnyService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {
    this.bunnies$ = this.bunniesSubject.asObservable();
  }

  ngOnInit(): void {
    // Check for view parameter from URL
    this.subscription.add(
      this.route.queryParams.subscribe(params => {
        const view = params['view'];
        if (view && ['chart', 'table', 'pen'].includes(view)) {
          this.initialView = view as 'chart' | 'table' | 'pen';
        }
      })
    );

    this.loadInitialBunnies();

    // Subscribe to real-time updates to handle new bunnies
    // But only for bunnies that are already in our loaded list
    this.subscription.add(
      this.firebaseService.getBunnies().subscribe({
        next: (realTimeBunnies) => {
          // Only handle real-time updates if we've already loaded initial data
          // and we're not currently loading more data
          if (this.allBunnies.length > 0 && !this.paginationState.isLoading) {
            this.handleRealTimeUpdate(realTimeBunnies);
          }
        },
        error: (error) => {
          console.error('Error in real-time subscription:', error);
        }
      })
    );

    // Load summary data to get total available bunnies and average happiness
    this.subscription.add(
      this.firebaseService.getSummaryDataRealtime().subscribe({
        next: (summaryData) => {
          if (summaryData) {
            this.totalAvailableBunnies = summaryData.totalBunnies;
            this.summaryAverageHappiness = summaryData.averageHappiness;

            this.updatePaginationState();
            this.cdr.detectChanges(); // Trigger change detection
          }
        },
        error: (error) => {
          console.error('Error loading summary data:', error);
          // Fallback to unlimited pagination if summary data fails
          this.totalAvailableBunnies = 0;
          this.summaryAverageHappiness = 0;
        }
      })
    );
  }

  private handleRealTimeUpdate(realTimeBunnies: Bunny[]): void {
    const currentBunnyIds = new Set(this.allBunnies.map(b => b.id));

    // Update existing bunnies with real-time data
    this.allBunnies = this.allBunnies.map(loadedBunny => {
      const realTimeBunny = realTimeBunnies.find(b => b.id === loadedBunny.id);
      return realTimeBunny || loadedBunny;
    });

    // Check if there are new bunnies that we haven't loaded yet
    const newBunnies = realTimeBunnies.filter(b => !currentBunnyIds.has(b.id));

    if (newBunnies.length > 0) {


      // Add new bunnies to the beginning of the list (most recent first)
      // Use a Map to ensure no duplicates by ID
      const bunnyMap = new Map<string, Bunny>();

            // Add new bunnies first (they should appear at the top)
      newBunnies.forEach(bunny => {
        if (bunny.id) {
          bunnyMap.set(bunny.id, bunny);
        }
      });

      // Add existing bunnies (they will be overwritten if already in map)
      this.allBunnies.forEach(bunny => {
        if (bunny.id) {
          bunnyMap.set(bunny.id, bunny);
        }
      });

      // Convert back to array
      this.allBunnies = Array.from(bunnyMap.values());
      this.paginationState.loadedCount = this.allBunnies.length;



      // Update pagination state after adding new bunnies
      this.updatePaginationState();

      // Update the observable
      this.bunniesSubject.next(this.allBunnies);

      // Debug: check for duplicates
      this.checkForDuplicates();
    } else {
      // Just update the observable with current loaded bunnies
      this.bunniesSubject.next(this.allBunnies);
    }
  }

  private updatePaginationState(): void {
    // Update hasMore based on total available bunnies
    if (this.totalAvailableBunnies > 0) {
      this.paginationState.hasMore = this.allBunnies.length < this.totalAvailableBunnies;
    }
    // If totalAvailableBunnies is 0, keep hasMore as true (unlimited pagination)
  }

  private resetPaginationAndReload(): void {
    // Reset pagination state
    this.paginationState = {
      hasMore: true,
      isLoading: false,
      loadedCount: 0
    };
    this.allBunnies = [];

    // Reload initial data
    const initialBatchSize = this.getInitialBatchSize();
    this.loadMoreBunnies(initialBatchSize);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private loadInitialBunnies(): void {
    this.loading = true;
    this.error = '';
    this.allBunnies = [];
    this.paginationState = {
      hasMore: true,
      isLoading: false,
      loadedCount: 0
    };

    // Load initial batch based on view type
    const initialBatchSize = this.getInitialBatchSize();
    this.loadMoreBunnies(initialBatchSize);
  }

  private getInitialBatchSize(): number {
    switch (this.initialView) {
      case 'table':
        return 5; // Start with 5 for table
      case 'chart':
        return 5; // Start with 5 for chart
      case 'pen':
        return 5; // Start with 5 for pen
      default:
        return 5;
    }
  }

  private loadMoreBunnies(batchSize: number = 5): void {
    if (this.paginationState.isLoading || !this.paginationState.hasMore) {
      return;
    }

    // Check if we've loaded all available bunnies based on summary data
    if (this.totalAvailableBunnies > 0 && this.allBunnies.length >= this.totalAvailableBunnies) {
      this.paginationState.hasMore = false;
      return;
    }

    this.paginationState.isLoading = true;
    this.bunnyService.getBunniesInfinite(batchSize, this.paginationState.lastDocument)
      .subscribe({
        next: (result: InfiniteScrollResult) => {
          // Prevent duplicates by using a Map
          const existingIds = new Set(this.allBunnies.map(b => b.id));
          const newBunnies = result.bunnies.filter(bunny => bunny.id && !existingIds.has(bunny.id));

          this.allBunnies = [...this.allBunnies, ...newBunnies];
          this.paginationState.lastDocument = result.lastDocument;
          this.paginationState.loadedCount = this.allBunnies.length;
          this.paginationState.isLoading = false;

          // Update hasMore based on summary data and loaded count
          this.updatePaginationState();

          // Update the observable
          this.bunniesSubject.next(this.allBunnies);
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading bunnies:', error);
          this.paginationState.isLoading = false;
          this.error = 'Failed to load bunnies';
          this.loading = false;
        }
      });
  }

  // Public method for views to request more data
  loadMoreData(): void {
    // Prevent multiple simultaneous loading requests
    if (this.paginationState.isLoading) {
      return;
    }

    // Prevent loading if we've already loaded all bunnies
    if (!this.paginationState.hasMore) {
      return;
    }

    const batchSize = this.getBatchSizeForCurrentView();
    this.loadMoreBunnies(batchSize);
  }

  private getBatchSizeForCurrentView(): number {
    switch (this.initialView) {
      case 'table':
        return 5; // Load 5 more for table
      case 'chart':
        return 5; // Load 5 more for chart
      case 'pen':
        return 50; // Load 50 more for pen
      default:
        return 5;
    }
  }

  // Getters for views to access pagination state
  get isLoading(): boolean {
    return this.paginationState.isLoading;
  }

  get hasMore(): boolean {
    return this.paginationState.hasMore;
  }

  get loadedCount(): number {
    return this.paginationState.loadedCount;
  }

  get totalBunnies(): number {
    return this.totalAvailableBunnies;
  }

  // Get average happiness from summary data
  get averageHappiness(): number {
    return this.summaryAverageHappiness;
  }



  openAddModal(): void {
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
  }

  onBunnyAdded(): void {
    // The real-time subscription will handle the new bunny automatically
    // New bunnies will appear at the top of the current view
  }



  // Debug method to check for duplicates
  private checkForDuplicates(): void {
    const ids = this.allBunnies.map(b => b.id).filter(id => id);
    const uniqueIds = new Set(ids);
    if (ids.length !== uniqueIds.size) {
      // Duplicates detected - this should not happen with current deduplication logic
      const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
      // Log to console only in development mode
      if (typeof ngDevMode === 'undefined' || ngDevMode) {
        console.warn(`Duplicate bunnies detected! Total: ${ids.length}, Unique: ${uniqueIds.size}`);
        console.warn('Duplicate IDs:', duplicates);
      }
    }
  }

  retryConnection(): void {
    this.loadInitialBunnies();
  }

  getHappinessColor(happiness: number): string {
    if (happiness >= 8) return '#28a745'; // Green for happy
    if (happiness >= 6) return '#ffc107'; // Yellow for okay
    if (happiness >= 4) return '#fd7e14'; // Orange for concerned
    return '#dc3545'; // Red for sad
  }

  getOverallHappinessColor(): string {
    // Use the current summary average happiness
    return this.getHappinessColor(this.summaryAverageHappiness);
  }


}
