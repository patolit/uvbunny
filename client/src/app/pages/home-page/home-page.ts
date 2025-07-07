import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { FirebaseService, Bunny } from '../../services/firebase';
import { BunnyViewer } from './bunny-viewer/bunny-viewer';
import { AddBunnyModal } from './add-bunny-modal/add-bunny-modal';
import { Observable, Subscription, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

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
  private subscription = new Subscription();
  private bunniesSubject = new BehaviorSubject<Bunny[]>([]);

  constructor(
    private firebaseService: FirebaseService,
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

    this.loadBunnies();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private loadBunnies(): void {
    this.loading = true;
    this.error = '';

    // Clear previous subscription
    this.subscription.unsubscribe();
    this.subscription = new Subscription();

    // Subscribe to bunnies for loading state management
    this.subscription.add(
      this.firebaseService.getBunnies().subscribe({
        next: (bunnies) => {
          this.bunniesSubject.next(bunnies);
          this.loading = false;
          this.error = '';
        },
        error: (error) => {
          console.error('Error loading bunnies:', error);
          this.error = 'Failed to load bunnies';
          this.loading = false;
          this.bunniesSubject.next([]);
        }
      })
    );
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
    // No need to reload - real-time updates will handle this
    console.log('Bunny added successfully!');
  }

  retryConnection(): void {
    this.loadBunnies();
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
