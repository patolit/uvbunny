// Bunny-related interfaces
export interface Bunny {
  id?: string;
  name: string;
  happiness: number;
  color: string;
  birthDate: string;
  playMates?: string[]; // Array of bunny IDs that this bunny has played with
  lastFeed?: any; // Firebase Timestamp
  lastPlay?: any; // Firebase Timestamp
  avatarUrl?: string;
  avatarUpdatedAt?: any; // Firebase Timestamp
}

export interface BunnyEvent {
  id?: string;
  bunnyId: string;
  eventType: 'feed' | 'play' | 'idle';
  eventData: {
    feedType?: 'carrot' | 'lettuce';
    playedWithBunnyId?: string;
    reason?: string;
    lastFeed?: any;
    lastPlay?: any;
    thresholdTime?: any;
  };
  timestamp: Date;
  status?: 'pending' | 'processing' | 'finished' | 'error' | 'rejected';
  createdAt?: any; // Firebase Timestamp
  processedAt?: any; // Firebase Timestamp
  errorAt?: any; // Firebase Timestamp
  rejectedAt?: any; // Firebase Timestamp
  errorMessage?: string;
  rejectionReason?: string;
  newHappiness?: number;
  deltaHappiness?: number;
  playmateBonus?: boolean;
  partnerBunnyId?: string;
  partnerHappinessIncrease?: number;
  newPartnerHappiness?: number;
  partnerDeltaHappiness?: number;
}

export interface SummaryData {
  totalBunnies: number;
  totalHappiness: number;
  averageHappiness: number;
  lastUpdated: any; // Firebase Timestamp
  lastEventId?: string;
}

// Configuration interfaces
export interface BaseConfiguration {
  id?: string;
  // Scoring system
  rewardScore: number;
  playScore: number;

  // Meal options with their happiness values
  meals: {
    lettuce: number;
    carrot: number;
  };

  // Activity types
  activities: {
    play: number;
    petting: number;
    grooming: number;
  };
}

export interface BunnyColor {
  name: string;
  hex: string;
}

// UI-specific interfaces
export interface BunnyPosition {
  bunny: Bunny;
  x: number;
  y: number;
  id: string;
}

// Service-specific interfaces
export interface InfiniteScrollState {
  lastDocument?: any; // QueryDocumentSnapshot<DocumentData>
  hasMore: boolean;
  isLoading: boolean;
  loadedCount: number;
}

export interface InfiniteScrollResult {
  bunnies: Bunny[];
  lastDocument?: any; // QueryDocumentSnapshot<DocumentData>
  hasMore: boolean;
  totalLoaded: number;
}
