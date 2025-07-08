import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Bunny } from '../../../services/firebase';
import { getBunnyColor } from '../../../utils/bunny-colors';

interface BunnyPosition {
  bunny: Bunny;
  x: number;
  y: number;
  id: string;
}

@Component({
  selector: 'app-bunny-pen',
  imports: [CommonModule],
  templateUrl: './bunny-pen.html',
  styleUrl: './bunny-pen.scss'
})
export class BunnyPen implements OnInit, OnChanges {
  @Input() bunnies: Bunny[] | null = [];
  @Input() isLoading: boolean = false;
  @Input() hasMore: boolean = true;
  @Input() loadedCount: number = 0;
  @Output() addBunny = new EventEmitter<void>();
  @Output() loadMore = new EventEmitter<void>();

  bunnyPositions: BunnyPosition[] = [];
  penWidth = 800;
  penHeight = 500;
  hoveredBunny: Bunny | null = null;
  mouseX = 0;
  mouseY = 0;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.positionBunnies();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['bunnies']) {
      this.positionBunnies();
    }
  }

  private positionBunnies(): void {
    if (!this.bunnies || this.bunnies.length === 0) {
      this.bunnyPositions = [];
      return;
    }

    // Simple random positioning within the pen boundaries
    const margin = 50; // Keep bunnies away from edges
    const maxX = this.penWidth - margin;
    const maxY = this.penHeight - margin;

    this.bunnyPositions = this.bunnies.map(bunny => ({
      bunny,
      x: Math.random() * (maxX - margin) + margin,
      y: Math.random() * (maxY - margin) + margin,
      id: `bunny-${bunny.id || Math.random()}`
    }));
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

  getHappinessEmoji(happiness: number): string {
    if (happiness >= 8) return '😊'; // Very happy
    if (happiness >= 6) return '🙂'; // Happy
    if (happiness >= 4) return '😐'; // Okay
    return '😢'; // Sad
  }

  onBunnyClick(bunny: Bunny): void {
    if (bunny.id) {
      this.router.navigate(['/bunny', bunny.id], {
        queryParams: { source: 'pen' }
      });
    }
  }

  onBunnyHover(bunny: Bunny, event: MouseEvent): void {
    this.hoveredBunny = bunny;
    this.mouseX = event.clientX;
    this.mouseY = event.clientY;
  }

  onBunnyLeave(): void {
    this.hoveredBunny = null;
  }

  onAddBunny(): void {
    this.addBunny.emit();
  }

  onLoadMore(): void {
    this.loadMore.emit();
  }

  getAge(birthDate: string): string {
    const birth = new Date(birthDate);
    const today = new Date();
    const ageInDays = Math.floor((today.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));

    if (ageInDays < 30) {
      return `${ageInDays} days`;
    } else if (ageInDays < 365) {
      const months = Math.floor(ageInDays / 30);
      return `${months} month${months > 1 ? 's' : ''}`;
    } else {
      const years = Math.floor(ageInDays / 365);
      return `${years} year${years > 1 ? 's' : ''}`;
    }
  }
}
