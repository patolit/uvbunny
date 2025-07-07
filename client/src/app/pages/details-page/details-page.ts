import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { FirebaseService, Bunny } from '../../services/firebase';
import { Observable, Subscription, BehaviorSubject, combineLatest } from 'rxjs';
import { map, startWith, debounceTime, distinctUntilChanged } from 'rxjs/operators';

interface SortConfig {
  column: keyof Bunny;
  direction: 'asc' | 'desc';
}

@Component({
  selector: 'app-details-page',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './details-page.html',
  styleUrl: './details-page.scss'
})
export class DetailsPage implements OnInit, OnDestroy {
  bunnies$: Observable<Bunny[]>;
  filteredBunnies$!: Observable<Bunny[]>;
  loading = true;
  error = '';
  searchTerm = '';
  sortConfig: SortConfig = { column: 'name', direction: 'asc' };

  private subscription = new Subscription();
  private bunniesSubject = new BehaviorSubject<Bunny[]>([]);
  private searchSubject = new BehaviorSubject<string>('');

  constructor(
    private firebaseService: FirebaseService,
    private router: Router
  ) {
    this.bunnies$ = this.bunniesSubject.asObservable();
    this.setupFilteredBunnies();
  }

  ngOnInit(): void {
    this.loadBunnies();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  loadBunnies(): void {
    this.loading = true;
    this.error = '';

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

  private setupFilteredBunnies(): void {
    this.filteredBunnies$ = combineLatest([
      this.bunnies$,
      this.searchSubject.pipe(
        startWith(''),
        debounceTime(300),
        distinctUntilChanged()
      )
    ]).pipe(
      map(([bunnies, searchTerm]) => {
        let filtered = bunnies;

        // Apply search filter
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          filtered = bunnies.filter(bunny =>
            bunny.name.toLowerCase().includes(term) ||
            bunny.color.toLowerCase().includes(term) ||
            bunny.happiness.toString().includes(term) ||
            bunny.birthDate.includes(term)
          );
        }

        // Apply sorting
        return this.sortBunnies(filtered, this.sortConfig);
      })
    );
  }

  onSearchChange(): void {
    this.searchSubject.next(this.searchTerm);
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.searchSubject.next('');
  }

  onSort(column: keyof Bunny): void {
    if (this.sortConfig.column === column) {
      this.sortConfig.direction = this.sortConfig.direction === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortConfig = { column, direction: 'asc' };
    }

    // Trigger re-sort by updating search subject
    this.searchSubject.next(this.searchTerm);
  }

    private sortBunnies(bunnies: Bunny[], config: SortConfig): Bunny[] {
    return [...bunnies].sort((a, b) => {
      let aValue = a[config.column];
      let bValue = b[config.column];

      // Handle undefined values
      if (aValue === undefined) aValue = '';
      if (bValue === undefined) bValue = '';

      // Handle different data types
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) {
        return config.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return config.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  getSortIcon(column: keyof Bunny): string {
    if (this.sortConfig.column !== column) {
      return 'bi-arrow-down-up';
    }
    return this.sortConfig.direction === 'asc' ? 'bi-arrow-up' : 'bi-arrow-down';
  }

  onBunnyClick(bunny: Bunny): void {
    if (bunny.id) {
      this.router.navigate(['/details', bunny.id]);
    }
  }

  getHappinessColor(happiness: number): string {
    if (happiness >= 8) return '#28a745'; // Green for very happy
    if (happiness >= 6) return '#ffc107'; // Yellow for happy
    if (happiness >= 4) return '#fd7e14'; // Orange for okay
    return '#dc3545'; // Red for sad
  }

  getBunnyColor(colorName: string): string {
    const colors = {
      'Brown': '#8B4513',
      'White': '#FFFFFF',
      'Gray': '#808080',
      'Black': '#000000',
      'Spotted': '#D3D3D3'
    };
    return colors[colorName as keyof typeof colors] || '#8B4513';
  }
}
