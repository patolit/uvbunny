import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Bunny } from '../../../services/firebase';
import { getBunnyColor } from '../../../utils/bunny-colors';

@Component({
  selector: 'app-bunny-chart',
  imports: [CommonModule],
  templateUrl: './bunny-chart.html',
  styleUrl: './bunny-chart.scss'
})
export class BunnyChart {
  @Input() bunnies: Bunny[] | null = [];
  @Input() isLoading: boolean = false;
  @Input() hasMore: boolean = true;
  @Input() loadedCount: number = 0;
  @Output() addBunny = new EventEmitter<void>();
  @Output() loadMore = new EventEmitter<void>();

  constructor(private router: Router) {}

  getBunnyColor(colorName: string | undefined): string {
    return getBunnyColor(colorName);
  }

  getHappinessPercentage(happiness: number): number {
    // Convert happiness from 0-10 scale to 0-100 percentage
    const percentage = (happiness / 10) * 100;
    return percentage;
  }

  @HostListener('scroll', ['$event'])
  onScroll(event: Event): void {
    const target = event.target as HTMLElement;
    if (this.isNearRightEdge(target)) {
      this.loadMore.emit();
    }
  }

  private isNearRightEdge(element: HTMLElement): boolean {
    const threshold = 100; // pixels from right edge
    const scrollLeft = element.scrollLeft;
    const scrollWidth = element.scrollWidth;
    const clientWidth = element.clientWidth;
    return scrollLeft + clientWidth >= scrollWidth - threshold;
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
