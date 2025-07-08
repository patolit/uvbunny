import { Component, Input, Output, EventEmitter, HostListener, OnDestroy, AfterViewInit, ElementRef, ChangeDetectorRef, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Bunny } from '../../../services/firebase';
import { getBunnyColor } from '../../../utils/bunny-colors';
import { Subject, debounceTime, takeUntil } from 'rxjs';

@Component({
  selector: 'app-bunny-chart',
  imports: [CommonModule],
  templateUrl: './bunny-chart.html',
  styleUrl: './bunny-chart.scss'
})
export class BunnyChart implements OnDestroy, AfterViewInit, OnChanges {
  @Input() bunnies: Bunny[] | null = [];
  @Input() isLoading: boolean = false;
  @Input() hasMore: boolean = true;
  @Input() loadedCount: number = 0;
  @Input() totalBunnies: number = 0;
  @Output() addBunny = new EventEmitter<void>();
  @Output() loadMore = new EventEmitter<void>();

  private destroy$ = new Subject<void>();
  private lastLoadMoreTime = 0;
  private resizeObserver: ResizeObserver | null = null;

  constructor(
    private router: Router,
    private elementRef: ElementRef,
    private cdr: ChangeDetectorRef
  ) {}

  ngAfterViewInit(): void {
    // Set up resize observer to detect when chart container size changes
    this.setupResizeObserver();

    // Set up scroll listener for the chart container
    this.setupScrollListener();

    // Initial check for available space
    setTimeout(() => {
      this.checkAvailableSpace();
    }, 100);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  private setupResizeObserver(): void {
    const chartContainer = this.elementRef.nativeElement.querySelector('.chart-scroll-container');
    if (chartContainer) {
      this.resizeObserver = new ResizeObserver(() => {
        this.checkAvailableSpace();
      });
      this.resizeObserver.observe(chartContainer);
    }
  }

  private setupScrollListener(): void {
    // The horizontal scroll happens on the .chart-bars element, not .chart-scroll-container
    const chartBars = this.elementRef.nativeElement.querySelector('.chart-bars');
    if (chartBars) {
      console.log('Setting up scroll listener on .chart-bars element');
      chartBars.addEventListener('scroll', (event: Event) => {
        const target = event.target as HTMLElement;
        console.log('Scroll event detected on chart-bars:', {
          scrollLeft: target.scrollLeft,
          scrollWidth: target.scrollWidth,
          clientWidth: target.clientWidth
        });
        if (this.isNearRightEdge(target)) {
          console.log('Chart scroll detected near right edge, triggering loadMore');
          this.triggerLoadMore();
        }
      });
    } else {
      console.error('Could not find .chart-bars element for scroll listener');
    }
  }

  private checkAvailableSpace(): void {
    if (!this.bunnies || this.bunnies.length === 0 || this.isLoading || !this.hasMore) {
      return;
    }

    const chartContainer = this.elementRef.nativeElement.querySelector('.chart-scroll-container');
    const chartBars = this.elementRef.nativeElement.querySelector('.chart-bars');

    if (!chartContainer || !chartBars) {
      return;
    }

    const containerWidth = chartContainer.clientWidth;
    const barsWidth = chartBars.scrollWidth;
    const barWidth = this.getBarWidth(); // Get current bar width based on screen size

    console.log(`Chart space check: container=${containerWidth}px, bars=${barsWidth}px, barWidth=${barWidth}px`);

    // Calculate how many bars can fit in the container
    const barsThatCanFit = Math.floor(containerWidth / barWidth);
    const currentBars = this.bunnies.length;

    console.log(`Bars that can fit: ${barsThatCanFit}, Current bars: ${currentBars}`);

    // If we have space for more bars and we have more bunnies to load, load them
    if (barsThatCanFit > currentBars && this.hasMore && !this.isLoading) {
      console.log(`Space available for ${barsThatCanFit - currentBars} more bars, loading more bunnies`);
      this.triggerLoadMore();
    }
  }

  private getBarWidth(): number {
    // Get the current bar width based on screen size (matching CSS)
    const width = window.innerWidth;
    if (width <= 576) {
      return 40; // Mobile
    } else if (width <= 768) {
      return 50; // Tablet
    } else {
      return 60; // Desktop
    }
  }

  private isNearRightEdge(element: HTMLElement): boolean {
    const threshold = 100; // pixels from right edge
    const scrollLeft = element.scrollLeft;
    const scrollWidth = element.scrollWidth;
    const clientWidth = element.clientWidth;
    const isNear = scrollLeft + clientWidth >= scrollWidth - threshold;

    console.log('isNearRightEdge check:', {
      scrollLeft,
      scrollWidth,
      clientWidth,
      threshold,
      isNear,
      calculation: scrollLeft + clientWidth,
      comparison: scrollWidth - threshold
    });

    return isNear;
  }

  private triggerLoadMore(): void {
    // Prevent multiple rapid calls (minimum 200ms between calls)
    const now = Date.now();
    if (now - this.lastLoadMoreTime < 200) {
      console.log('Chart: LoadMore called too quickly, ignoring');
      return;
    }
    this.lastLoadMoreTime = now;
    this.loadMore.emit();
  }

  // Called when bunnies input changes
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['bunnies']) {
      // Check for available space when bunnies are updated
      setTimeout(() => {
        this.checkAvailableSpace();
      }, 100);
    }
  }

  getBunnyColor(colorName: string | undefined): string {
    return getBunnyColor(colorName);
  }

  getHappinessPercentage(happiness: number): number {
    // Convert happiness from 0-10 scale to 0-100 percentage
    const percentage = (happiness / 10) * 100;
    return percentage;
  }

  onBunnyClick(bunny: Bunny): void {
    if (bunny.id) {
      this.router.navigate(['/bunny', bunny.id], {
        queryParams: { source: 'chart' }
      });
    }
  }

  onAddBunny(): void {
    this.addBunny.emit();
  }
}
