import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirebaseService, Bunny } from '../../services/firebase';
import { BunnyChart } from './bunny-chart/bunny-chart';
import { AddBunnyModal } from './add-bunny-modal/add-bunny-modal';

@Component({
  selector: 'app-home-page',
  imports: [CommonModule, FormsModule, BunnyChart, AddBunnyModal],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss'
})
export class HomePage implements OnInit {
  bunnies: Bunny[] = [];
  loading = true;
  error = '';
  showAddModal = false;

  constructor(private firebaseService: FirebaseService) {}

  async ngOnInit(): Promise<void> {
    await this.loadBunnies();
  }

  async loadBunnies(): Promise<void> {
    try {
      this.loading = true;
      this.error = '';
      this.bunnies = await this.firebaseService.getBunnies();
    } catch (error) {
      console.error('Error loading bunnies:', error);
      this.error = 'Failed to load bunnies';
    } finally {
      this.loading = false;
    }
  }

  get averageHappiness(): number {
    if (this.bunnies.length === 0) return 0;
    const total = this.bunnies.reduce((sum, bunny) => sum + bunny.happiness, 0);
    return Math.round((total / this.bunnies.length) * 10); // Convert to percentage
  }

  openAddModal(): void {
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
  }

  onBunnyAdded(): void {
    this.loadBunnies();
  }

  getHappinessColor(happiness: number): string {
    if (happiness >= 80) return '#28a745'; // Green for happy
    if (happiness >= 60) return '#ffc107'; // Yellow for okay
    if (happiness >= 40) return '#fd7e14'; // Orange for concerned
    return '#dc3545'; // Red for sad
  }

  getOverallHappinessColor(): string {
    return this.getHappinessColor(this.averageHappiness);
  }
}
