import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirebaseService, Bunny } from '../../../services/firebase';
import { Observable, map } from 'rxjs';

@Component({
  selector: 'app-play-partner-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './play-partner-modal.html',
  styleUrl: './play-partner-modal.scss'
})
export class PlayPartnerModal implements OnInit {
  @Input() currentBunnyId: string = '';
  @Input() currentBunnyName: string = '';
  @Output() partnerSelected = new EventEmitter<string>();
  @Output() modalClosed = new EventEmitter<void>();

  availableBunnies$: Observable<Bunny[]>;
  selectedPartnerId: string = '';
  searchTerm: string = '';
  loading = true;

  constructor(private firebaseService: FirebaseService) {
    this.availableBunnies$ = this.firebaseService.getBunnies().pipe(
      map(bunnies => bunnies.filter(bunny => bunny.id !== this.currentBunnyId))
    );
  }

  ngOnInit(): void {
    this.availableBunnies$.subscribe({
      next: () => this.loading = false,
      error: () => this.loading = false
    });
  }

  onCancel(): void {
    this.modalClosed.emit();
  }

  onConfirm(): void {
    if (this.selectedPartnerId) {
      this.partnerSelected.emit(this.selectedPartnerId);
    }
  }

  getFilteredBunnies(bunnies: Bunny[]): Bunny[] {
    if (!this.searchTerm) return bunnies;
    return bunnies.filter(bunny =>
      bunny.name.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  getBunnyColor(colorName: string): string {
    const colors = {
      'Brown': '#8B4513',
      'White': '#FFFFFF',
      'Gray': '#808080',
      'Black': '#000000',
      'Spotted': '#D3D3D3'
    };
    return colors[colorName as keyof typeof colors] || '#8B4513';
  }

  isConfirmDisabled(): boolean {
    return !this.selectedPartnerId;
  }
}
