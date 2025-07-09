import { Component, OnInit, OnDestroy, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FirebaseService, Bunny } from '../../services/firebase';
import { Observable, Subscription, switchMap, of, take } from 'rxjs';
import { map } from 'rxjs/operators';
import { PlayPartnerModal } from './play-partner-modal/play-partner-modal';
import { AvatarComponent } from './avatar/avatar.component';

@Component({
  selector: 'app-bunny-detail',
  imports: [CommonModule, FormsModule, RouterModule, PlayPartnerModal, AvatarComponent],
  templateUrl: './bunny-detail.html',
  styleUrl: './bunny-detail.scss'
})
export class BunnyDetail implements OnInit, OnDestroy, OnChanges {
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
    play: false
  };
  private subscription = new Subscription();
  private previousHappiness = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private firebaseService: FirebaseService,
    private cdr: ChangeDetectorRef
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
          } else {
            // Check if happiness increased (indicating a successful action)
            if (bunny.happiness > this.previousHappiness) {
              // Trigger change detection to ensure UI updates
              this.cdr.detectChanges();
              // Use requestAnimationFrame to ensure UI updates before stopping loading
              requestAnimationFrame(() => {
                this.stopAllLoadingStates();
              });
            }
            // Update previous happiness
            this.previousHappiness = bunny.happiness;
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

  ngOnChanges(changes: SimpleChanges): void {
    // This will be called when any input changes, but we're not using inputs
    // We'll handle happiness changes in the bunny$ subscription
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

    this.firebaseService.feedBunny(bunnyId, 'lettuce')
      .pipe(take(1))
      .subscribe({
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
    // If modal is closed without selecting a partner, stop loading
    this.loadingStates.play = false;
  }

      onPlayPartnerSelected(partnerId: string): void {
    if (this.currentBunny) {
      // Loading state is already set from onPlayWithBunny
      this.firebaseService.playWithBunny(this.currentBunny.id!, partnerId)
        .pipe(take(1))
        .subscribe({
          next: () => {
            this.showPlayModal = false;
            // Loading state will be cleared when happiness changes
          },
          error: (error) => {
            console.error('Error playing with bunny:', error);
            this.loadingStates.play = false;
          }
        });
    }
  }

  onAvatarUploaded(newUrl: string) {
    if (this.currentBunny) {
      this.currentBunny.avatarUrl = newUrl;
    }
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

    /**
   * Stop all loading states when happiness increases
   */
  private stopAllLoadingStates(): void {
    this.loadingStates.feedLettuce = false;
    this.loadingStates.feedCarrot = false;
    this.loadingStates.play = false;
  }
}
