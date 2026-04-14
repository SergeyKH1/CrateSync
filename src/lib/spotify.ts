import type { PlaylistData, SpotifyTrack } from "@/lib/types";

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

  const data: { access_token: string } = await res.json();
  return data.access_token;
}

/**
 * Fetch playlist data via Spotify's embed page.
 * This approach requires no API credentials and works for any public playlist,
 * including Spotify-owned editorial playlists.
 */
async function fetchPlaylistViaEmbed(
  playlistId: string
): Promise<PlaylistData> {
  const cacheBust = Date.now();
  const embedUrl = `https://open.spotify.com/embed/playlist/${playlistId}?_cb=${cacheBust}`;
  const res = await fetch(embedUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch playlist embed: ${res.status}`);
  }

  const html = await res.text();

  // Extract __NEXT_DATA__ JSON from the embed page
  const ndMatch = html.match(
    /<script\s+id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/
  );
  if (!ndMatch) {
    throw new Error("Could not parse playlist data from Spotify");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = JSON.parse(ndMatch[1]);
  const entity = data?.props?.pageProps?.state?.data?.entity;

  if (!entity) {
    throw new Error("Playlist data not found in Spotify response");
  }

  // Try to use the embed's access token to call the real API for fresh data
  const embedToken = findNestedKey(data, "accessToken");
  if (embedToken) {
    try {
      const apiTracks = await fetchTracksWithToken(playlistId, embedToken);
      if (apiTracks.length > 0) {
        return {
          name: entity.name ?? "Unknown Playlist",
          description: undefined,
          imageUrl: entity.coverArt?.sources?.[0]?.url,
          trackCount: apiTracks.length,
          tracks: apiTracks,
          source: "spotify",
        };
      }
    } catch {
      // Fall through to embed data
    }
  }

  // Fallback: use the track list from the embed page (may be cached/stale)
  const trackList: Array<{
    uri: string;
    title: string;
    subtitle: string;
    duration: number;
  }> = entity.trackList ?? [];

  const tracks: SpotifyTrack[] = trackList.map((t, i) => {
    const idMatch = t.uri.match(/spotify:track:(\w+)/);
    const artists = t.subtitle
      .replace(/\u00a0/g, " ")
      .split(",")
      .map((a: string) => a.trim())
      .filter(Boolean);

    return {
      id: idMatch ? idMatch[1] : `embed-${i}`,
      name: t.title,
      artists,
      album: "",
      duration_ms: t.duration,
      spotify_url: idMatch
        ? `https://open.spotify.com/track/${idMatch[1]}`
        : "",
    };
  });

  return {
    name: entity.name ?? "Unknown Playlist",
    description: undefined,
    imageUrl: entity.coverArt?.sources?.[0]?.url,
    trackCount: tracks.length,
    tracks,
    source: "spotify",
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findNestedKey(obj: any, key: string): string | undefined {
  if (typeof obj !== "object" || obj === null) return undefined;
  if (key in obj) return obj[key];
  for (const v of Object.values(obj)) {
    const found = findNestedKey(v, key);
    if (found) return found;
  }
  return undefined;
}

async function fetchTracksWithToken(
  playlistId: string,
  token: string
): Promise<SpotifyTrack[]> {
  const tracks: SpotifyTrack[] = [];
  let url: string | null =
    `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`;

  while (url) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (!res.ok) throw new Error(`Spotify API: ${res.status}`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const page: any = await res.json();

    for (const item of page.items ?? []) {
      const t = item?.track;
      if (!t) continue;
      tracks.push({
        id: t.id,
        name: t.name,
        artists: (t.artists ?? []).map((a: { name: string }) => a.name),
        album: t.album?.name ?? "",
        duration_ms: t.duration_ms,
        isrc: t.external_ids?.isrc,
        spotify_url: t.external_urls?.spotify ?? "",
      });
    }

    url = page.next;
  }

  return tracks;
}

/**
 * Fetch playlist data from Spotify.
 * Uses the embed page (no auth required) as primary method.
 * Falls back to Web API if credentials are set and embed fails.
 * Falls back to mock data if nothing else works.
 */
export async function fetchPlaylist(
  url: string,
  userToken?: string
): Promise<PlaylistData> {
  const parsed = parseSpotifyUrl(url);
  if (!parsed) {
    throw new Error("Invalid Spotify URL");
  }

  if (parsed.type !== "playlist") {
    throw new Error(
      `Unsupported Spotify type: ${parsed.type}. Only playlists are supported.`
    );
  }

  // If user is logged in with Spotify, use their token (handles private playlists)
  if (userToken) {
    return await fetchPlaylistWithToken(parsed.id, userToken);
  }

  // Primary: use embed page (works for all public playlists, no auth needed)
  try {
    return await fetchPlaylistViaEmbed(parsed.id);
  } catch (embedError) {
    console.warn(
      "Embed fetch failed, trying API fallback:",
      embedError instanceof Error ? embedError.message : embedError
    );
  }

  // Fallback: use Web API if credentials are configured
  if (process.env.SPOTIFY_CLIENT_ID) {
    try {
      return await fetchPlaylistViaApi(parsed.id);
    } catch (apiError) {
      console.warn(
        "API fetch failed:",
        apiError instanceof Error ? apiError.message : apiError
      );
    }
  }

  // Last resort: mock data
  console.warn("All fetch methods failed, returning mock data");
  return getMockPlaylist();
}

/**
 * Fetch playlist via the official Spotify Web API (requires credentials).
 */
async function fetchPlaylistViaApi(playlistId: string): Promise<PlaylistData> {
  const token = await getSpotifyToken();
  return fetchPlaylistWithToken(playlistId, token);
}

/**
 * Fetch playlist using a provided access token (user OAuth or client credentials).
 */
async function fetchPlaylistWithToken(
  playlistId: string,
  token: string
): Promise<PlaylistData> {
  const playlistRes = await fetch(
    `https://api.spotify.com/v1/playlists/${playlistId}`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
  );

  if (!playlistRes.ok) {
    const errorBody = await playlistRes.text().catch(() => "");
    throw new Error(`Spotify API error: ${playlistRes.status} ${errorBody}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const playlist: any = await playlistRes.json();

  console.log(
    `[fetchPlaylistWithToken] Playlist "${playlist.name}" - top-level keys: ${Object.keys(playlist).join(", ")}`
  );
  if (playlist.tracks) {
    console.log(
      `[fetchPlaylistWithToken] tracks keys: ${Object.keys(playlist.tracks).join(", ")}, total: ${playlist.tracks.total}, items: ${playlist.tracks.items?.length}`
    );
  } else {
    console.log(`[fetchPlaylistWithToken] NO tracks field. Full response: ${JSON.stringify(playlist).slice(0, 500)}`);
  }

  // Extract tracks directly from the playlist response
  // (avoids separate /tracks call which can return 403 on some playlists)
  const tracks: SpotifyTrack[] = [];

  // Parse first page of tracks from playlist response
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function parseTracks(items: any[]) {
    for (const item of items) {
      const t = item?.track;
      if (!t) continue;
      tracks.push({
        id: t.id,
        name: t.name,
        artists: (t.artists ?? []).map((a: { name: string }) => a.name),
        album: t.album?.name ?? "",
        duration_ms: t.duration_ms,
        isrc: t.external_ids?.isrc,
        spotify_url: t.external_urls?.spotify ?? "",
      });
    }
  }

  if (playlist.tracks?.items) {
    parseTracks(playlist.tracks.items);
  }

  // If playlist response didn't include tracks, fetch them separately
  if (tracks.length === 0) {
    let nextUrl: string | null =
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`;

    while (nextUrl) {
      const tracksRes = await fetch(nextUrl, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      if (!tracksRes.ok) {
        const errorBody = await tracksRes.text().catch(() => "");
        console.log(`[fetchPlaylistWithToken] /tracks fallback failed: ${tracksRes.status} ${errorBody}`);
        break;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const page: any = await tracksRes.json();
      parseTracks(page.items ?? []);
      nextUrl = page.next;
    }
  } else {
    // Paginate if there are more tracks (playlist.tracks.next)
    let nextUrl: string | null = playlist.tracks?.next ?? null;
    while (nextUrl) {
      const tracksRes = await fetch(nextUrl, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      if (!tracksRes.ok) break;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const page: any = await tracksRes.json();
      parseTracks(page.items ?? []);
      nextUrl = page.next;
    }
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
