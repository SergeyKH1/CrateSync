import Fuse from "fuse.js";
import type {
  SpotifyTrack,
  BandcampResult,
  TrackMatch,
  AlternativeLink,
} from "@/lib/types";

/**
 * Normalise a string for comparison: lowercase, strip "feat." / "ft.",
 * remove parenthetical suffixes like "(Remix)" or "(Original Mix)", and trim.
 */
export function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .replace(/\bfeat\.?\s*/gi, "")
    .replace(/\bft\.?\s*/gi, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/\[[^\]]*\]/g, "")
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Calculate similarity between two strings on a 0-100 scale.
 * Uses a combination of Fuse.js scoring and token overlap.
 */
export function calculateSimilarity(a: string, b: string): number {
  const na = normalizeString(a);
  const nb = normalizeString(b);

  if (na === nb) return 100;
  if (na.length === 0 || nb.length === 0) return 0;

  // Token-overlap (Jaccard-ish) score
  const tokensA = new Set(na.split(/\s+/));
  const tokensB = new Set(nb.split(/\s+/));
  const intersection = [...tokensA].filter((t) => tokensB.has(t)).length;
  const union = new Set([...tokensA, ...tokensB]).size;
  const tokenScore = union > 0 ? (intersection / union) * 100 : 0;

  // Fuse.js score (0 = perfect match, 1 = no match)
  const fuse = new Fuse([{ text: nb }], {
    keys: ["text"],
    includeScore: true,
    threshold: 1.0,
  });
  const fuseResult = fuse.search(na);
  const fuseScore =
    fuseResult.length > 0 ? (1 - (fuseResult[0].score ?? 1)) * 100 : 0;

  return Math.round(Math.max(tokenScore, fuseScore));
}

/**
 * 3-pass matching of a Spotify track against Bandcamp search results.
 *
 * Pass 1 - exact: normalised title + first artist match with confidence > 90
 * Pass 2 - close: collect results with confidence 50-90
 * Pass 3 - not found: nothing useful, return alternative search links
 */
export function matchTrack(
  track: SpotifyTrack,
  results: BandcampResult[]
): TrackMatch {
  if (results.length === 0) {
    return {
      track,
      status: "not_found",
      confidence: 0,
      alternativeLinks: generateAlternativeLinks(track),
    };
  }

  const trackLabel = `${track.artists[0] ?? ""} ${track.name}`;

  type Scored = { result: BandcampResult; score: number };
  const scored: Scored[] = results.map((r) => {
    const resultLabel = `${r.artist} ${r.title}`;
    const score = calculateSimilarity(trackLabel, resultLabel);
    return { result: r, score };
  });

  scored.sort((a, b) => b.score - a.score);

  // Pass 1: exact match
  const best = scored[0];
  if (best.score > 90) {
    return {
      track,
      status: "exact",
      confidence: best.score,
      bandcampMatch: best.result,
    };
  }

  // Pass 2: close matches (50-90)
  const closeMatches = scored
    .filter((s) => s.score >= 50 && s.score <= 90)
    .slice(0, 3)
    .map((s) => s.result);

  if (closeMatches.length > 0) {
    return {
      track,
      status: "close",
      confidence: scored[0].score,
      closeMatches,
      alternativeLinks: generateAlternativeLinks(track),
    };
  }

  // Pass 3: not found
  return {
    track,
    status: "not_found",
    confidence: scored[0]?.score ?? 0,
    alternativeLinks: generateAlternativeLinks(track),
  };
}

/**
 * Generate search URLs for Beatport, Juno, and Traxsource.
 */
export function generateAlternativeLinks(
  track: SpotifyTrack
): AlternativeLink[] {
  const q = encodeURIComponent(
    `${track.artists[0] ?? ""} ${track.name}`.trim()
  );

  return [
    {
      platform: "beatport",
      searchUrl: `https://www.beatport.com/search?q=${q}`,
    },
    {
      platform: "juno",
      searchUrl: `https://www.juno.co.uk/search/?q%5Ball%5D%5B%5D=${q}`,
    },
    {
      platform: "traxsource",
      searchUrl: `https://www.traxsource.com/search?term=${q}`,
    },
  ];
}
