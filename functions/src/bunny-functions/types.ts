export type EventStatus = "pending" | "processing" | "finished" | "error" | "rejected";

export interface BunnyEvent {
  bunnyId: string;
  eventType: "feed" | "play" | "pet" | "groom";
  eventData?: {
    feedType?: "carrot" | "lettuce";
    playedWithBunnyId?: string;
  };
  status: EventStatus;
  createdAt: FirebaseFirestore.Timestamp;
  processedAt?: FirebaseFirestore.Timestamp;
  errorAt?: FirebaseFirestore.Timestamp;
  rejectedAt?: FirebaseFirestore.Timestamp;
  errorMessage?: string;
  rejectionReason?: string;
  newHappiness?: number;
  playmateBonus?: boolean;
  partnerBunnyId?: string;
  partnerHappinessIncrease?: number;
  newPartnerHappiness?: number;
}

export interface Bunny {
  id: string;
  name: string;
  happiness: number;
  color: string;
  birthDate: string;
  playMates?: string[];
  lastFeed?: FirebaseFirestore.Timestamp;
  lastPlay?: FirebaseFirestore.Timestamp;
}

export interface Configuration {
  meals: {
    carrot: number;
    lettuce: number;
  };
  activities: {
    petting: number;
    grooming: number;
  };
  playScore: number;
}

export interface SummaryData {
  totalBunnies: number;
  totalHappiness: number;
  averageHappiness: number;
  lastUpdated: FirebaseFirestore.Timestamp;
  lastEventId?: string;
}
