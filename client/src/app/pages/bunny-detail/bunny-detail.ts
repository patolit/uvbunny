import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FirebaseService, Bunny } from '../../services/firebase';
import { Observable, Subscription, switchMap, of, take } from 'rxjs';
import { map } from 'rxjs/operators';
import { PlayPartnerModal } from './play-partner-modal/play-partner-modal';

@Component({
  selector: 'app-bunny-detail',
  imports: [CommonModule, FormsModule, RouterModule, PlayPartnerModal],
  templateUrl: './bunny-detail.html',
  styleUrl: './bunny-detail.scss'
})
export class BunnyDetail implements OnInit, OnDestroy {
  bunny$: Observable<Bunny | null>;
  availableBunnies$: Observable<Bunny[]>;
  loading = true;
  error = '';
  showPlayModal = false;
  currentBunny: Bunny | null = null;
  sourceView: string = 'home';
  loadingStates = {
    feedLettuce: false,
    feedCarrot: false,
    play: false,
    pet: false,
    groom: false
  };
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

    // Get available bunnies for play (excluding current bunny)
    this.availableBunnies$ = this.route.params.pipe(
      switchMap(params => {
        const currentId = params['id'];
        if (!currentId) {
          return of([]);
        }
        return this.firebaseService.getBunnies().pipe(
          map(bunnies => bunnies.filter(b => b.id !== currentId))
        );
      })
    );
  }

  ngOnInit(): void {
    // Get source view from query parameters
    this.subscription.add(
      this.route.queryParams.subscribe(params => {
        this.sourceView = params['source'] || 'home';
      })
    );

    this.subscription.add(
      this.bunny$.subscribe({
        next: (bunny) => {
          this.loading = false;
          this.currentBunny = bunny;
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
    // Navigate back to the source view
    this.router.navigate(['/home'], {
      queryParams: { view: this.sourceView }
    });
  }

  onFeedLettuce(bunnyId: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.loadingStates.feedLettuce = true;
    console.log('Button clicked: Feeding lettuce to bunny:', bunnyId);
    this.firebaseService.feedBunny(bunnyId, 'lettuce')
      .pipe(take(1))
      .subscribe({
        next: () => {
          console.log('Fed lettuce to bunny');
          this.loadingStates.feedLettuce = false;
        },
        error: (error) => {
          console.error('Error feeding bunny:', error);
          this.loadingStates.feedLettuce = false;
        }
      });
  }

  onFeedCarrot(bunnyId: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.loadingStates.feedCarrot = true;
    this.firebaseService.feedBunny(bunnyId, 'carrot')
      .pipe(take(1))
      .subscribe({
        next: () => {
          console.log('Fed carrot to bunny');
          this.loadingStates.feedCarrot = false;
        },
        error: (error) => {
          console.error('Error feeding bunny:', error);
          this.loadingStates.feedCarrot = false;
        }
      });
  }

  onPlayWithBunny(bunnyId: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.loadingStates.play = true;
    this.showPlayModal = true;
  }

  onPlayModalClosed(): void {
    this.showPlayModal = false;
    this.loadingStates.play = false;
  }

  onPlayPartnerSelected(partnerId: string): void {
    if (this.currentBunny) {
      this.firebaseService.playWithBunny(this.currentBunny.id!, partnerId)
        .pipe(take(1))
        .subscribe({
          next: () => {
            console.log('Played with bunny partner');
            this.showPlayModal = false;
            this.loadingStates.play = false;
          },
          error: (error) => {
            console.error('Error playing with bunny:', error);
            this.loadingStates.play = false;
          }
        });
    }
  }

  onPetBunny(bunnyId: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.loadingStates.pet = true;
    this.firebaseService.performActivity(bunnyId, 'petting')
      .pipe(take(1))
      .subscribe({
        next: () => {
          console.log('Petted bunny');
          this.loadingStates.pet = false;
        },
        error: (error) => {
          console.error('Error petting bunny:', error);
          this.loadingStates.pet = false;
        }
      });
  }

  onGroomBunny(bunnyId: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.loadingStates.groom = true;
    this.firebaseService.performActivity(bunnyId, 'grooming')
      .pipe(take(1))
      .subscribe({
        next: () => {
          console.log('Groomed bunny');
          this.loadingStates.groom = false;
        },
        error: (error) => {
          console.error('Error grooming bunny:', error);
          this.loadingStates.groom = false;
        }
      });
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
