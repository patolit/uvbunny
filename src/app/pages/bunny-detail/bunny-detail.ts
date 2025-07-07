import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FirebaseService, Bunny } from '../../services/firebase';
import { Observable, Subscription, switchMap, of } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-bunny-detail',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './bunny-detail.html',
  styleUrl: './bunny-detail.scss'
})
export class BunnyDetail implements OnInit, OnDestroy {
  bunny$: Observable<Bunny | null>;
  loading = true;
  error = '';
  private subscription = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private firebaseService: FirebaseService
  ) {
    this.bunny$ = this.route.params.pipe(
      switchMap(params => {
        const id = params['id'];
        if (!id) {
          return of(null);
        }
        return this.firebaseService.getBunnies().pipe(
          map(bunnies => bunnies.find(b => b.id === id) || null)
        );
      })
    );
  }

  ngOnInit(): void {
    this.subscription.add(
      this.bunny$.subscribe({
        next: (bunny) => {
          this.loading = false;
          if (!bunny) {
            this.error = 'Bunny not found';
          }
        },
        error: (error) => {
          console.error('Error loading bunny:', error);
          this.error = 'Failed to load bunny details';
          this.loading = false;
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  onBackClick(): void {
    this.router.navigate(['/details']);
  }

  onFeedLettuce(bunnyId: string): void {
    this.subscription.add(
      this.firebaseService.feedBunny(bunnyId, 'lettuce').subscribe({
        next: () => console.log('Fed lettuce to bunny'),
        error: (error) => console.error('Error feeding bunny:', error)
      })
    );
  }

  onFeedCarrot(bunnyId: string): void {
    this.subscription.add(
      this.firebaseService.feedBunny(bunnyId, 'carrot').subscribe({
        next: () => console.log('Fed carrot to bunny'),
        error: (error) => console.error('Error feeding bunny:', error)
      })
    );
  }

  onPlayWithBunny(bunnyId: string): void {
    this.subscription.add(
      this.firebaseService.playWithBunny(bunnyId).subscribe({
        next: () => console.log('Played with bunny'),
        error: (error) => console.error('Error playing with bunny:', error)
      })
    );
  }

  onPetBunny(bunnyId: string): void {
    this.subscription.add(
      this.firebaseService.performActivity(bunnyId, 'petting').subscribe({
        next: () => console.log('Petted bunny'),
        error: (error) => console.error('Error petting bunny:', error)
      })
    );
  }

  onGroomBunny(bunnyId: string): void {
    this.subscription.add(
      this.firebaseService.performActivity(bunnyId, 'grooming').subscribe({
        next: () => console.log('Groomed bunny'),
        error: (error) => console.error('Error grooming bunny:', error)
      })
    );
  }

  getHappinessColor(happiness: number): string {
    if (happiness >= 8) return '#28a745'; // Green for very happy
    if (happiness >= 6) return '#ffc107'; // Yellow for happy
    if (happiness >= 4) return '#fd7e14'; // Orange for okay
    return '#dc3545'; // Red for sad
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

  getHappinessPercentage(happiness: number): number {
    return (happiness / 10) * 100;
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

  getHappinessStatus(happiness: number): string {
    if (happiness >= 8) return 'Very Happy';
    if (happiness >= 6) return 'Happy';
    if (happiness >= 4) return 'Okay';
    return 'Sad';
  }
}
