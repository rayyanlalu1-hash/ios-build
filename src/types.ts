export type MatchStatus = "LIVE" | "SCHEDULED" | "FINISHED";

export interface Team {
  name: string;
  code: string;
  flag: string; // Emoji flag or code
  color: string; // Tailwind color class or hex (e.g., "#E50914" or "bg-red-650")
  secondaryColor?: string;
  avatarUrl?: string;
}

export interface GoalEvent {
  minute: number;
  player: string;
  teamCode: string;
  penalty?: boolean;
  ownGoal?: boolean;
}

export interface TimelineEvent {
  id: string;
  minute: number;
  type: "goal" | "card-yellow" | "card-red" | "sub" | "foul" | "shot" | "offside";
  teamCode: string;
  player: string;
  detail: string;
}

export interface MatchStatistics {
  possession: [number, number]; // [Home, Away]
  shots: [number, number];
  shotsOnTarget: [number, number];
  xg: [number, number]; // Expected Goals e.g. [1.88, 1.21]
  fouls: [number, number];
  yellowCards: [number, number];
  redCards: [number, number];
  offsides: [number, number];
  corners: [number, number];
  passes: [number, number];
  passAccuracy: [number, number]; // percentage e.g. [88, 81]
}

export interface Player {
  id: string;
  name: string;
  number: number;
  position: "GK" | "DEF" | "MID" | "FWD";
  rating: number; // e.g. 7.8
  goalsInTournament: number;
  speed: number; // 1-100 scale
  stamina: number; // 1-100 scale
  x: number; // percentage width on pitch (0-100)
  y: number; // percentage height on pitch (0-100)
}

export interface Lineup {
  formation: string;
  players: Player[];
}

export interface Match {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number;
  awayScore: number;
  status: MatchStatus;
  minute: number;
  group: string;
  stadium: string;
  spectators: string;
  referee: string;
  goals: GoalEvent[];
  stats?: MatchStatistics;
  lineups?: {
    home: Lineup;
    away: Lineup;
  };
  timeline: TimelineEvent[];
  heroImage: string; // Banner background
  date: string; // "YYYY-MM-DD" style date
  streamUrl?: string; // Optional match-specific stream URL
  drmKey?: string; // Optional match-specific ClearKey Pair
  highlightsUrl?: string; // Optional match ended highlights video
  highlightsDrmKey?: string; // Optional highlights DRM key
  highlightsThumbnailUrl?: string; // Custom thumbnail for high quality highlight clipping
  highlightsUploadTime?: string; // Uploading/release time for highlights video
  liveUploadTime?: string; // Uploading/release time for live stream
}

export interface CommentaryTrack {
  code: string;
  name: string;
  flag: string;
  channel: string;
  commentator: string;
}

export interface StandingRow {
  id: string; // matches the code
  name: string;
  flag: string;
  gp: number; // Games Played
  w: number;  // Wins
  d: number;  // Draws
  l: number;  // Losses
  gf: number; // Goals For
  ga: number; // Goals Against
  pts: number; // Points
  manual?: boolean; // indicates if manually added or compiled
}
