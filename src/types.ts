export interface TimeInterval {
  start: number; // in hours, e.g. 14.5 for 14:30
  end: number;   // in hours, e.g. 18.0 for 18:00
}

export interface Player {
  id: string;
  name: string;
  avatarSeed: string; // seed for unique procedurally styled blocky avatars
  intervals: TimeInterval[]; // intervals when the player is available
  color: string; // Hex color for active display
  isDemo?: boolean; // flag if it's an interactive demo player
}

export interface Lobby {
  id: string;
  title: string;
  targetDuration: number; // target continuous block duration in hours (e.g. 2, 3, 4)
  createdAt: number;
  players: { [id: string]: Player };
}

export interface TimeSlotAnalysis {
  time: number; // hour in decimal form (0.0, 0.5, 1.0, etc.)
  timeLabel: string; // e.g. "14:30"
  availablePlayers: string[]; // List of player names available
  count: number; // count of players available
}

export interface OptimalIntervalResult {
  start: number;
  end: number;
  playerIds: string[];
  maxCount: number;
  score: number; // calculated score incorporating length and number of players
}
