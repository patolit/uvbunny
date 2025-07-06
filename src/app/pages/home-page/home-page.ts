import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirebaseService, Bunny } from '../../services/firebase';
import { BunnyChart } from './bunny-chart/bunny-chart';
import { AddBunnyModal } from './add-bunny-modal/add-bunny-modal';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-home-page',
  imports: [CommonModule, FormsModule, BunnyChart, AddBunnyModal],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss'
})
export class HomePage implements OnInit, OnDestroy {
  bunnies$: Observable<Bunny[]>;
  loading = true;
  error = '';
  showAddModal = false;
  private subscription = new Subscription();

  constructor(private firebaseService: FirebaseService) {
    this.bunnies$ = this.firebaseService.getBunnies();
  }

  ngOnInit(): void {
    // Subscribe to bunnies for loading state management
    this.subscription.add(
      this.bunnies$.subscribe({
        next: () => {
          this.loading = false;
          this.error = '';
        },
        error: (error) => {
          console.error('Error loading bunnies:', error);
          this.error = 'Failed to load bunnies';
          this.loading = false;
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

    // Calculate average happiness from observable
  get averageHappiness(): number {
    let bunnies: Bunny[] = [];
    this.bunnies$.subscribe(b => bunnies = b).unsubscribe();

    if (bunnies.length === 0) return 0;
    const total = bunnies.reduce((sum, bunny) => sum + bunny.happiness, 0);
    return Math.round((total / bunnies.length) * 10); // Convert to percentage
  }

  // Observable for average happiness
  get averageHappiness$(): Observable<number> {
    return this.bunnies$.pipe(
      map((bunnies: Bunny[]) => {
        if (bunnies.length === 0) return 0;
        const total = bunnies.reduce((sum: number, bunny: Bunny) => sum + bunny.happiness, 0);
        return Math.round((total / bunnies.length) * 10); // Convert to percentage
      })
    );
  }

  openAddModal(): void {
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
  }

  onBunnyAdded(): void {
    // No need to reload - real-time updates will handle this
    console.log('Bunny added successfully!');
  }

  getHappinessColor(happiness: number): string {
    if (happiness >= 80) return '#28a745'; // Green for happy
    if (happiness >= 60) return '#ffc107'; // Yellow for okay
    if (happiness >= 40) return '#fd7e14'; // Orange for concerned
    return '#dc3545'; // Red for sad
  }

  getOverallHappinessColor(): string {
    let bunnies: Bunny[] = [];
    this.bunnies$.subscribe(b => bunnies = b).unsubscribe();

    if (bunnies.length === 0) return '#dc3545'; // Red for no bunnies

    const total = bunnies.reduce((sum, bunny) => sum + bunny.happiness, 0);
    const average = Math.round((total / bunnies.length) * 10);
    return this.getHappinessColor(average);
  }
}
