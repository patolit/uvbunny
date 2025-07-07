export interface Bunny {
  id?: string;
  name: string;
  happiness: number;
  color: string;
  birthDate: string;
  playMates?: string[]; // Array of bunny IDs that this bunny has played with
}

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

export interface BunnyEvent {
  id?: string;
  bunnyId: string;
  eventType: 'feed' | 'play';
  eventData: {
    feedType?: 'carrot' | 'lettuce';
    playedWithBunnyId?: string;
  };
  timestamp: Date;
}
