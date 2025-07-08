import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { FirebaseService, Bunny } from '../../services/firebase';
import { BunnyViewer } from './bunny-viewer/bunny-viewer';
import { AddBunnyModal } from './add-bunny-modal/add-bunny-modal';
import { Observable, Subscription, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { BunnyService, InfiniteScrollState, InfiniteScrollResult } from '../../services/bunny';
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

  constructor(
    private firebaseService: FirebaseService,
    private bunnyService: BunnyService,
    private route: ActivatedRoute
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
  }

  private handleRealTimeUpdate(realTimeBunnies: Bunny[]): void {
    // Only update existing bunnies in our list, don't add new ones
    // This prevents loading all bunnies at once
    const currentBunnyIds = new Set(this.allBunnies.map(b => b.id));

    // Update existing bunnies with real-time data
    this.allBunnies = this.allBunnies.map(loadedBunny => {
      const realTimeBunny = realTimeBunnies.find(b => b.id === loadedBunny.id);
      return realTimeBunny || loadedBunny;
    });

    // Check if there are new bunnies that we haven't loaded yet
    const newBunnies = realTimeBunnies.filter(b => !currentBunnyIds.has(b.id));

    console.log(`Real-time update: ${realTimeBunnies.length} total bunnies, ${this.allBunnies.length} loaded, ${newBunnies.length} new (not loading yet)`);

    // Don't automatically add new bunnies - let pagination handle that
    // Just update the observable with current loaded bunnies
    this.bunniesSubject.next(this.allBunnies);
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

    this.paginationState.isLoading = true;
    console.log(`Loading ${batchSize} more bunnies, current count: ${this.paginationState.loadedCount}`);

    this.bunnyService.getBunniesInfinite(batchSize, this.paginationState.lastDocument)
      .subscribe({
        next: (result: InfiniteScrollResult) => {
          console.log(`Received ${result.bunnies.length} bunnies, hasMore: ${result.hasMore}`);

          this.allBunnies = [...this.allBunnies, ...result.bunnies];
          this.paginationState.lastDocument = result.lastDocument;
          this.paginationState.hasMore = result.hasMore;
          this.paginationState.loadedCount = this.allBunnies.length;
          this.paginationState.isLoading = false;

          // Update the observable
          this.bunniesSubject.next(this.allBunnies);
          this.loading = false;

          console.log(`Updated total count: ${this.paginationState.loadedCount} bunnies`);
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
    console.log(`loadMoreData called for view: ${this.initialView}`);
    console.log(`Current state: loaded=${this.paginationState.loadedCount}, hasMore=${this.paginationState.hasMore}, isLoading=${this.paginationState.isLoading}`);

    const batchSize = this.getBatchSizeForCurrentView();
    console.log(`Will load ${batchSize} more bunnies`);

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

  // Calculate average happiness from observable
  get averageHappiness(): number {
    const bunnies = this.bunniesSubject.value;
    if (bunnies.length === 0) return 0;
    const total = bunnies.reduce((sum, bunny) => sum + bunny.happiness, 0);
    return Math.round((total / bunnies.length) * 10); // Convert to percentage
  }

  // Observable for average happiness
  get averageHappiness$(): Observable<number> {
    return this.bunnies$.pipe(
      map((bunnies: Bunny[]) => {
        if (bunnies.length === 0) return 0;
        const total = bunnies.reduce((sum: number, bunny: Bunny) => sum + bunny.happiness, 0);
        return Math.round((total / bunnies.length) * 10); // Convert to percentage
      })
    );
  }

  openAddModal(): void {
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
  }

  onBunnyAdded(): void {
    // The real-time subscription will handle the new bunny automatically
    console.log('Bunny added successfully!');
    // No need to manually reload - the real-time update will handle it
  }

  retryConnection(): void {
    this.loadInitialBunnies();
  }

  getHappinessColor(happiness: number): string {
    if (happiness >= 80) return '#28a745'; // Green for happy
    if (happiness >= 60) return '#ffc107'; // Yellow for okay
    if (happiness >= 40) return '#fd7e14'; // Orange for concerned
    return '#dc3545'; // Red for sad
  }

  getOverallHappinessColor(): string {
    let bunnies: Bunny[] = [];
    this.bunnies$.subscribe(b => bunnies = b).unsubscribe();

    if (bunnies.length === 0) return '#dc3545'; // Red for no bunnies

    const total = bunnies.reduce((sum, bunny) => sum + bunny.happiness, 0);
    const average = Math.round((total / bunnies.length) * 10);
    return this.getHappinessColor(average);
  }
}
