import { PlaylistData, SpotifyTrack } from "./types";

/**
 * Parse a Spotify URL into its type and ID.
 * Supports open.spotify.com links, spotify: URIs, and share links.
 */
export function parseSpotifyUrl(
  url: string
): { type: string; id: string } | null {
  // spotify:playlist:6rqhFgbbKwnb9MLmUQDhG6
  const uriMatch = url.match(/^spotify:(\w+):([a-zA-Z0-9]+)$/);
  if (uriMatch) {
    return { type: uriMatch[1], id: uriMatch[2] };
  }

  // https://open.spotify.com/playlist/6rqhFgbbKwnb9MLmUQDhG6?si=...
  // Also handles /intl-xx/ prefix and album/track types
  try {
    const parsed = new URL(url);
    if (
      parsed.hostname === "open.spotify.com" ||
      parsed.hostname === "play.spotify.com"
    ) {
      const pathMatch = parsed.pathname.match(
        /^(?:\/intl-[a-z]{2})?\/(\w+)\/([a-zA-Z0-9]+)/
      );
      if (pathMatch) {
        return { type: pathMatch[1], id: pathMatch[2] };
      }
    }
  } catch {
    // not a valid URL, fall through
  }

  return null;
}

const MOCK_TRACKS: SpotifyTrack[] = [
  {
    id: "mock-1",
    name: "Clear",
    artists: ["Cybotron"],
    album: "Clear",
    duration_ms: 289000,
    spotify_url: "https://open.spotify.com/track/mock1",
  },
  {
    id: "mock-2",
    name: "Jaguar",
    artists: ["The Aztec Mystic"],
    album: "Jaguar",
    duration_ms: 421000,
    spotify_url: "https://open.spotify.com/track/mock2",
  },
  {
    id: "mock-3",
    name: "SH-101",
    artists: ["Robert Hood"],
    album: "Internal Empire",
    duration_ms: 342000,
    spotify_url: "https://open.spotify.com/track/mock3",
  },
  {
    id: "mock-4",
    name: "Blackwater",
    artists: ["Octave One"],
    album: "Blackwater",
    duration_ms: 478000,
    spotify_url: "https://open.spotify.com/track/mock4",
  },
  {
    id: "mock-5",
    name: "Acid Tracks",
    artists: ["Phuture"],
    album: "Acid Tracks",
    duration_ms: 721000,
    spotify_url: "https://open.spotify.com/track/mock5",
  },
  {
    id: "mock-6",
    name: "Shari Vari",
    artists: ["A Number Of Names"],
    album: "Shari Vari",
    duration_ms: 390000,
    spotify_url: "https://open.spotify.com/track/mock6",
  },
  {
    id: "mock-7",
    name: "Phylyps Trak II",
    artists: ["Basic Channel"],
    album: "BCD-2",
    duration_ms: 610000,
    spotify_url: "https://open.spotify.com/track/mock7",
  },
  {
    id: "mock-8",
    name: "M04a",
    artists: ["Maurizio"],
    album: "M-Series",
    duration_ms: 540000,
    spotify_url: "https://open.spotify.com/track/mock8",
  },
  {
    id: "mock-9",
    name: "Dead Man Watches The Clock",
    artists: ["Dettmann & Klock"],
    album: "Dawning",
    duration_ms: 455000,
    spotify_url: "https://open.spotify.com/track/mock9",
  },
  {
    id: "mock-10",
    name: "In The Trees (C2 Remix)",
    artists: ["Faze Action"],
    album: "Broad Souls",
    duration_ms: 502000,
    spotify_url: "https://open.spotify.com/track/mock10",
  },
];

function getMockPlaylist(): PlaylistData {
  return {
    name: "Detroit Techno Essentials",
    description: "A curated selection of essential Detroit techno tracks",
    imageUrl: undefined,
    trackCount: MOCK_TRACKS.length,
    tracks: MOCK_TRACKS,
    source: "spotify",
  };
}

/**
 * Get an access token via Spotify Client Credentials flow.
 */
async function getSpotifyToken(): Promise<string> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Spotify credentials not configured");
  }

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    throw new Error(`Spotify auth failed: ${res.status}`);
  }

  const data = await res.json();
  return data.access_token;
}

/**
 * Fetch playlist data from Spotify. Falls back to mock data when
 * SPOTIFY_CLIENT_ID is not set.
 */
export async function fetchPlaylist(url: string): Promise<PlaylistData> {
  const parsed = parseSpotifyUrl(url);
  if (!parsed) {
    throw new Error("Invalid Spotify URL");
  }

  if (parsed.type !== "playlist") {
    throw new Error(`Unsupported Spotify type: ${parsed.type}. Only playlists are supported.`);
  }

  // Mock mode when credentials are not configured
  if (!process.env.SPOTIFY_CLIENT_ID) {
    return getMockPlaylist();
  }

  const token = await getSpotifyToken();

  // Fetch playlist metadata
  const playlistRes = await fetch(
    `https://api.spotify.com/v1/playlists/${parsed.id}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!playlistRes.ok) {
    throw new Error(`Spotify API error: ${playlistRes.status}`);
  }

  const playlist = await playlistRes.json();

  // Collect all tracks (handle pagination)
  const tracks: SpotifyTrack[] = [];
  let nextUrl: string | null =
    `https://api.spotify.com/v1/playlists/${parsed.id}/tracks?limit=100`;

  while (nextUrl) {
    const tracksRes = await fetch(nextUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!tracksRes.ok) {
      throw new Error(`Spotify API error fetching tracks: ${tracksRes.status}`);
    }

    const page = await tracksRes.json();

    for (const item of page.items) {
      if (!item.track) continue;
      const t = item.track;
      tracks.push({
        id: t.id,
        name: t.name,
        artists: t.artists.map((a: { name: string }) => a.name),
        album: t.album?.name ?? "",
        duration_ms: t.duration_ms,
        isrc: t.external_ids?.isrc,
        spotify_url: t.external_urls?.spotify ?? "",
      });
    }

    nextUrl = page.next;
  }

  return {
    name: playlist.name,
    description: playlist.description ?? undefined,
    imageUrl: playlist.images?.[0]?.url,
    trackCount: tracks.length,
    tracks,
    source: "spotify",
  };
}
