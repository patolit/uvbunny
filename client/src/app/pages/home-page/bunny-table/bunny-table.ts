import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Bunny } from '../../../services/firebase';

@Component({
  selector: 'app-bunny-table',
  imports: [CommonModule, FormsModule],
  templateUrl: './bunny-table.html',
  styleUrl: './bunny-table.scss'
})
export class BunnyTable {
  @Input() bunnies: Bunny[] | null = [];
  @Output() addBunny = new EventEmitter<void>();

  searchTerm = '';
  sortConfig = { column: 'name', direction: 'asc' as 'asc' | 'desc' };

  bunnyColors = [
    { name: 'Brown', hex: '#8B4513' },
    { name: 'White', hex: '#FFFFFF' },
    { name: 'Gray', hex: '#808080' },
    { name: 'Black', hex: '#000000' },
    { name: 'Spotted', hex: '#D3D3D3' }
  ];

  constructor(private router: Router) {}

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

  onBunnyClick(bunny: Bunny): void {
    if (bunny.id) {
      this.router.navigate(['/bunny', bunny.id]);
    }
  }

  onSort(column: string): void {
    if (this.sortConfig.column === column) {
      this.sortConfig.direction = this.sortConfig.direction === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortConfig.column = column;
      this.sortConfig.direction = 'asc';
    }
  }

  getSortIcon(column: string): string {
    if (this.sortConfig.column !== column) {
      return 'bi-arrow-down-up';
    }
    return this.sortConfig.direction === 'asc' ? 'bi-arrow-up' : 'bi-arrow-down';
  }

  get filteredBunnies(): Bunny[] {
    if (!this.bunnies) return [];

    let filtered = this.bunnies.filter(bunny =>
      bunny.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      bunny.color.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      bunny.happiness.toString().includes(this.searchTerm) ||
      bunny.birthDate.toLowerCase().includes(this.searchTerm.toLowerCase())
    );

    // Sort
    filtered.sort((a, b) => {
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

    return filtered;
  }

  clearSearch(): void {
    this.searchTerm = '';
  }
}
