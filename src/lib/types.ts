export interface SpotifyTrack {
  id: string;
  name: string;
  artists: string[];
  album: string;
  duration_ms: number;
  isrc?: string;
  spotify_url: string;
}

export interface BandcampResult {
  title: string;
  artist: string;
  album: string;
  url: string;
  imageUrl?: string;
  price?: string;
  type: "track" | "album";
  bandcampId?: string;
}

export type MatchStatus = "exact" | "close" | "not_found";

export interface TrackMatch {
  track: SpotifyTrack;
  status: MatchStatus;
  confidence: number;
  bandcampMatch?: BandcampResult;
  closeMatches?: BandcampResult[];
  alternativeLinks?: AlternativeLink[];
}

export interface AlternativeLink {
  platform: "beatport" | "juno" | "traxsource";
  searchUrl: string;
}

export interface PlaylistData {
  name: string;
  description?: string;
  imageUrl?: string;
  trackCount: number;
  tracks: SpotifyTrack[];
  source: "spotify" | "soundcloud" | "apple_music";
}

export interface SyncProgress {
  total: number;
  completed: number;
  current?: string;
  status: "idle" | "parsing" | "searching" | "complete" | "error";
  error?: string;
}

export interface SyncResults {
  playlist: PlaylistData;
  matches: TrackMatch[];
  stats: {
    total: number;
    exact: number;
    close: number;
    notFound: number;
  };
}

export type WishlistAction = "wishlist" | "cart";

export interface ExtensionMessage {
  type: "CRATESYNC_ADD";
  action: WishlistAction;
  url: string;
  trackName: string;
}

export interface ExtensionResponse {
  success: boolean;
  error?: string;
}
