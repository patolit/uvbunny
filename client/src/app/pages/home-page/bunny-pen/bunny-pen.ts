import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Bunny } from '../../../services/firebase';

@Component({
  selector: 'app-bunny-pen',
  imports: [CommonModule],
  templateUrl: './bunny-pen.html',
  styleUrl: './bunny-pen.scss'
})
export class BunnyPen {
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

  getHappinessColor(happiness: number): string {
    if (happiness >= 8) return '#28a745'; // Green for very happy
    if (happiness >= 6) return '#ffc107'; // Yellow for happy
    if (happiness >= 4) return '#fd7e14'; // Orange for okay
    return '#dc3545'; // Red for sad
  }

  onAddBunny(): void {
    this.addBunny.emit();
  }
}
