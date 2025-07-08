import { Component, Input, Output, EventEmitter } from '@angular/core';
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
  @Output() addBunny = new EventEmitter<void>();

  constructor(private router: Router) {}

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
