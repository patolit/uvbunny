import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirebaseService, Bunny } from '../../../services/firebase';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-add-bunny-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './add-bunny-modal.html',
  styleUrl: './add-bunny-modal.scss'
})
export class AddBunnyModal {
  @Input() showModal = false;
  @Output() modalClosed = new EventEmitter<void>();
  @Output() bunnyAdded = new EventEmitter<void>();

  // Add bunny form
  newBunny = {
    name: '',
    color: 'Brown',
    happiness: 5
  };

  // Color options for bunny selection
  bunnyColors = [
    { name: 'Brown', hex: '#8B4513' },
    { name: 'White', hex: '#FFFFFF' },
    { name: 'Gray', hex: '#808080' },
    { name: 'Black', hex: '#000000' },
    { name: 'Spotted', hex: '#D3D3D3' }
  ];

  loading = false;
  error = '';
  private subscription = new Subscription();

  constructor(private firebaseService: FirebaseService) {}

  openModal(): void {
    this.resetForm();
  }

  closeModal(): void {
    this.modalClosed.emit();
    this.resetForm();
  }

  resetForm(): void {
    this.newBunny = {
      name: '',
      color: 'Brown',
      happiness: 5
    };
    this.error = '';
  }

  addBunny(): void {
    if (!this.newBunny.name.trim()) {
      return; // Don't add if name is empty
    }

    this.loading = true;
    this.error = '';

    const bunnyData: Omit<Bunny, 'id'> = {
      name: this.newBunny.name.trim(),
      birthDate: new Date().toISOString().split('T')[0], // Today's date
      happiness: this.newBunny.happiness,
      color: this.newBunny.color
    };

    this.subscription.add(
      this.firebaseService.addBunny(bunnyData).subscribe({
        next: () => {
          // Close modal and emit event
          this.closeModal();
          this.bunnyAdded.emit();
          console.log('Bunny added successfully!');
        },
        error: (error) => {
          console.error('Error adding bunny:', error);
          this.error = 'Failed to add bunny';
        },
        complete: () => {
          this.loading = false;
        }
      })
    );
  }
}
