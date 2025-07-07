import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Bunny } from '../../../services/firebase';

@Component({
  selector: 'app-bunny-chart',
  imports: [CommonModule],
  templateUrl: './bunny-chart.html',
  styleUrl: './bunny-chart.scss'
})
export class BunnyChart {
  @Input() bunnies: Bunny[] | null = [];
  @Output() addBunny = new EventEmitter<void>();

  bunnyColors = [
    { name: 'Brown', hex: '#8B4513' },
    { name: 'White', hex: '#FFFFFF' },
    { name: 'Gray', hex: '#808080' },
    { name: 'Black', hex: '#000000' },
    { name: 'Spotted', hex: '#D3D3D3' }
  ];

  getBunnyColor(colorName: string | undefined): string {
    if (!colorName) return '#8B4513'; // Default brown
    const color = this.bunnyColors.find(c => c.name === colorName);
    return color ? color.hex : '#8B4513';
  }

  getHappinessPercentage(happiness: number): number {
    // Convert happiness from 0-10 scale to 0-100 percentage
    return (happiness / 10) * 100;
  }

  onAddBunny(): void {
    this.addBunny.emit();
  }
}
