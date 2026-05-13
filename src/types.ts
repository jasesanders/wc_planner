export type ViewingPlan =
  | "undecided"
  | "in_person"
  | "fan_zone"
  | "cosm"
  | "good_tv"
  | "skip";

export type MatchStage =
  | "group"
  | "round_of_32"
  | "round_of_16"
  | "quarter_final"
  | "semi_final"
  | "third_place"
  | "final";

export type Match = {
  id: string;
  matchNumber?: number;
  stage: MatchStage;
  date: string;
  timeLocal?: string;
  venue: string;
  city: string;
  homeSlot: string;
  awaySlot: string;
  confirmedTeams?: string[];
  group?: string;
  notes?: string;
};

export type TeamRating = {
  team: string;
  confederation?: string;
  rating: number;
  brandScore: number;
};

export type UserMatchPlan = {
  matchId: string;
  viewingPlan: ViewingPlan;
  selectedViewingOptionId?: string;
  priority: 1 | 2 | 3 | 4 | 5;
  notes: string;
  ticketInterest: boolean;
  lockedIn: boolean;
};

export type ViewingOptionType =
  | "official_fan_festival"
  | "official_fan_zone"
  | "city_watch_party"
  | "cosm"
  | "sports_bar"
  | "concert_or_nightlife"
  | "other";

export type CostType = "free" | "paid" | "mixed" | "unknown";

export type ViewingOptionMatchConfidence = "confirmed_match" | "confirmed_date" | "likely" | "unknown";

export type ViewingOption = {
  id: string;
  name: string;
  type: ViewingOptionType;
  venueName: string;
  address?: string;
  city: string;
  neighborhood?: string;
  startDate: string;
  endDate: string;
  dates?: string[];
  costType: CostType;
  ticketRequired?: boolean;
  reservationRecommended?: boolean;
  ticketUrl?: string;
  sourceUrl: string;
  notes?: string;
  bestFor?: string[];
  matchRules?: {
    allMatches?: boolean;
    stages?: MatchStage[];
    teams?: string[];
    matchIds?: string[];
    onlyHighDemand?: boolean;
  };
};

export type ViewingOptionMatch = {
  option: ViewingOption;
  confidence: ViewingOptionMatchConfidence;
  reason: string;
};

export type TeamProbability = {
  team: string;
  probability: number;
  rating: number;
  brandScore: number;
};

export type PredictedMatchup = {
  home: string;
  away: string;
  probability: number;
  interestScore: number;
};
