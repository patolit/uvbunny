import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  OnDestroy,
  OnInit,
  HostListener,
  ElementRef,
  ChangeDetectorRef,
  AfterViewInit,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Bunny } from '../../../services/firebase';
import { getBunnyColor } from '../../../utils/bunny-colors';
import { Subject, debounceTime, distinctUntilChanged, takeUntil, BehaviorSubject, combineLatest } from 'rxjs';

@Component({
  selector: 'app-bunny-table',
  imports: [CommonModule, FormsModule],
  templateUrl: './bunny-table.html',
  styleUrl: './bunny-table.scss',
})
export class BunnyTable implements OnInit, OnChanges, OnDestroy, AfterViewInit {
  @Input() bunnies: Bunny[] | null = [];
  @Input() isLoading: boolean = false;
  @Input() hasMore: boolean = true;
  @Input() loadedCount: number = 0;
  @Output() addBunny = new EventEmitter<void>();
  @Output() loadMore = new EventEmitter<void>();

  searchTerm = '';
  filteredBunnies: Bunny[] = [];
  sortConfig = { column: 'name', direction: 'asc' as 'asc' | 'desc' };
  private lastLoadMoreTime = 0;

  @ViewChild('tableContainer', { static: false }) tableContainerRef!: ElementRef;

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private elementRef: ElementRef,
    private cdr: ChangeDetectorRef
  ) {
    // Set up debounced search
    this.searchSubject
      .pipe(
        debounceTime(300), // Wait 300ms after user stops typing
        distinctUntilChanged(), // Only emit if value has changed
        takeUntil(this.destroy$)
      )
      .subscribe((searchTerm) => {
        this.searchTerm = searchTerm;
        this.filterBunnies();
      });
  }

  ngOnInit(): void {
    this.filterBunnies();
  }

  ngAfterViewInit(): void {
    // Set up scroll listener for the table container
    this.setupScrollListener();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['bunnies']) {
      this.filterBunnies();
    }
  }

    private setupScrollListener(): void {
    // Use the ViewChild reference to get the table container element
    if (this.tableContainerRef && this.tableContainerRef.nativeElement) {
      console.log('Setting up scroll listener on table container');
      this.tableContainerRef.nativeElement.addEventListener('scroll', (event: Event) => {
        const target = event.target as HTMLElement;
        if (this.isNearBottomOfElement(target)) {
          console.log('Table scroll detected near bottom, triggering loadMore');
          this.triggerLoadMore();
        }
      });
    } else {
      console.error('Could not find table container element for scroll listener');
    }
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    // Also check window scroll as fallback
    if (this.isNearBottom()) {
      console.log('Window scroll detected near bottom, triggering loadMore');
      this.triggerLoadMore();
    }
  }

  private triggerLoadMore(): void {
    // Prevent multiple rapid calls (minimum 200ms between calls)
    const now = Date.now();
    if (now - this.lastLoadMoreTime < 200) {
      console.log('LoadMore called too quickly, ignoring');
      return;
    }

    // Only trigger if we have more data to load and not currently loading
    if (!this.hasMore || this.isLoading) {
      console.log('Not triggering loadMore - hasMore:', this.hasMore, 'isLoading:', this.isLoading);
      return;
    }

    this.lastLoadMoreTime = now;
    console.log('Triggering loadMore event');
    this.loadMore.emit();
  }

  private isNearBottom(): boolean {
    const threshold = 100; // pixels from bottom
    const position = window.scrollY + window.innerHeight;
    const height = document.documentElement.scrollHeight;
    return position > height - threshold;
  }

  private isNearBottomOfElement(element: HTMLElement): boolean {
    const threshold = 50; // pixels from bottom
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight;
    const clientHeight = element.clientHeight;
    const isNear = scrollTop + clientHeight >= scrollHeight - threshold;

    console.log('isNearBottomOfElement check:', {
      scrollTop,
      scrollHeight,
      clientHeight,
      threshold,
      isNear,
      calculation: scrollTop + clientHeight,
      comparison: scrollHeight - threshold
    });

    return isNear;
  }

      ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    // Clean up scroll listener
    if (this.tableContainerRef && this.tableContainerRef.nativeElement) {
      // Remove the scroll listener by recreating the element reference
      this.tableContainerRef.nativeElement = null;
    }
  }

  getBunnyColor(colorName: string | undefined): string {
    return getBunnyColor(colorName);
  }

  getHappinessColor(happiness: number): string {
    if (happiness >= 8) return '#28a745'; // Green for very happy
    if (happiness >= 6) return '#ffc107'; // Yellow for happy
    if (happiness >= 4) return '#fd7e14'; // Orange for okay
    return '#dc3545'; // Red for sad
  }

  onAddBunny(): void {
    this.addBunny.emit();
  }

  onBunnyClick(bunny: Bunny): void {
    if (bunny.id) {
      this.router.navigate(['/bunny', bunny.id], {
        queryParams: { source: 'table' },
      });
    }
  }

  onSort(column: string): void {
    if (this.sortConfig.column === column) {
      this.sortConfig.direction =
        this.sortConfig.direction === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortConfig.column = column;
      this.sortConfig.direction = 'asc';
    }
    this.filterBunnies(); // Re-filter to apply new sorting
  }

  getSortIcon(column: string): string {
    if (this.sortConfig.column !== column) {
      return 'bi-arrow-down-up';
    }
    return this.sortConfig.direction === 'asc'
      ? 'bi-arrow-up'
      : 'bi-arrow-down';
  }

  filterBunnies(): void {
    if (!this.bunnies || this.bunnies.length === 0) {
      this.filteredBunnies = [];
      return;
    }

    // If search term is empty, return all bunnies
    if (!this.searchTerm.trim()) {
      this.filteredBunnies = this.sortBunnies(this.bunnies);
      return;
    }

    const searchLower = this.searchTerm.toLowerCase().trim();

    let filtered = this.bunnies.filter(
      (bunny) => {
        // Safely check each field with null/undefined protection
        const nameMatch = bunny.name && bunny.name.toLowerCase().includes(searchLower);
        const colorMatch = bunny.color && bunny.color.toLowerCase().includes(searchLower);
        const happinessMatch = bunny.happiness !== undefined && bunny.happiness !== null &&
                              bunny.happiness.toString().includes(searchLower);
        const birthDateMatch = bunny.birthDate && bunny.birthDate.toLowerCase().includes(searchLower);

        return nameMatch || colorMatch || happinessMatch || birthDateMatch;
      }
    );

    this.filteredBunnies = this.sortBunnies(filtered);
  }

  private sortBunnies(bunnies: Bunny[]): Bunny[] {
    return bunnies.sort((a, b) => {
      let aValue: any = a[this.sortConfig.column as keyof Bunny];
      let bValue: any = b[this.sortConfig.column as keyof Bunny];

      if (this.sortConfig.column === 'birthDate') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (aValue < bValue) return this.sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.searchSubject.next('');
    this.filterBunnies();
  }

  filterResults(): void {
    this.searchSubject.next(this.searchTerm);
  }
}
