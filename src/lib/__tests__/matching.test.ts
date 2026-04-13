import {
  normalizeString,
  calculateSimilarity,
  matchTrack,
  generateAlternativeLinks,
} from "@/lib/matching";
import type { SpotifyTrack, BandcampResult } from "@/lib/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTrack(overrides: Partial<SpotifyTrack> = {}): SpotifyTrack {
  return {
    id: "t1",
    name: "Clear",
    artists: ["Cybotron"],
    album: "Clear",
    duration_ms: 289000,
    spotify_url: "https://open.spotify.com/track/t1",
    ...overrides,
  };
}

function makeResult(overrides: Partial<BandcampResult> = {}): BandcampResult {
  return {
    title: "Clear",
    artist: "Cybotron",
    album: "Clear",
    url: "https://cybotron.bandcamp.com/track/clear",
    type: "track",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// normalizeString
// ---------------------------------------------------------------------------

describe("normalizeString", () => {
  it("lowercases input", () => {
    expect(normalizeString("HELLO")).toBe("hello");
  });

  it('removes "feat." and "feat "', () => {
    expect(normalizeString("Track feat. Someone")).toBe("track someone");
  });

  it('removes "ft."', () => {
    expect(normalizeString("Track ft. Someone")).toBe("track someone");
  });

  it("removes parentheticals like (Remix)", () => {
    expect(normalizeString("Track (Original Mix)")).toBe("track");
  });

  it("removes bracketed content", () => {
    expect(normalizeString("Track [Bonus]")).toBe("track");
  });

  it("trims and collapses whitespace", () => {
    expect(normalizeString("  hello   world  ")).toBe("hello world");
  });

  it("handles empty string", () => {
    expect(normalizeString("")).toBe("");
  });

  it("handles strings with only parentheticals", () => {
    expect(normalizeString("(Remix)")).toBe("");
  });
});

// ---------------------------------------------------------------------------
// calculateSimilarity
// ---------------------------------------------------------------------------

describe("calculateSimilarity", () => {
  it("returns 100 for identical normalised strings", () => {
    expect(calculateSimilarity("Clear", "clear")).toBe(100);
  });

  it("returns 0 when one string is empty", () => {
    expect(calculateSimilarity("", "something")).toBe(0);
  });

  it("returns a high score for very similar strings", () => {
    const score = calculateSimilarity("Cybotron Clear", "Cybotron - Clear");
    expect(score).toBeGreaterThanOrEqual(60);
  });

  it("returns a low score for completely different strings", () => {
    const score = calculateSimilarity("ABCDEF", "XYZ123");
    expect(score).toBeLessThanOrEqual(30);
  });
});

// ---------------------------------------------------------------------------
// matchTrack
// ---------------------------------------------------------------------------

describe("matchTrack", () => {
  it("returns exact match when artist + title match closely", () => {
    const track = makeTrack();
    const results = [makeResult()];
    const match = matchTrack(track, results);

    expect(match.status).toBe("exact");
    expect(match.confidence).toBeGreaterThan(90);
    expect(match.bandcampMatch).toBeDefined();
  });

  it("returns close matches for slight variations", () => {
    const track = makeTrack({ name: "Jaguar", artists: ["The Aztec Mystic"] });
    const results = [
      makeResult({ title: "Jaguar (Remastered)", artist: "Aztec Mystic" }),
      makeResult({ title: "Jaguar Dub", artist: "Aztec Mystic" }),
      makeResult({ title: "Jaguar Edit", artist: "Aztec Mystic" }),
    ];
    const match = matchTrack(track, results);

    expect(match.status).toBe("close");
    expect(match.closeMatches).toBeDefined();
    expect(match.closeMatches!.length).toBeGreaterThanOrEqual(1);
    expect(match.closeMatches!.length).toBeLessThanOrEqual(3);
  });

  it("returns not_found with alternative links when no results match", () => {
    const track = makeTrack({ name: "Nonexistent Track", artists: ["Nobody"] });
    const results = [
      makeResult({ title: "Completely Different", artist: "Other Artist" }),
    ];
    const match = matchTrack(track, results);

    expect(match.status).toBe("not_found");
    expect(match.alternativeLinks).toBeDefined();
    expect(match.alternativeLinks!.length).toBe(3);
  });

  it("returns not_found with alternatives for empty results array", () => {
    const track = makeTrack();
    const match = matchTrack(track, []);

    expect(match.status).toBe("not_found");
    expect(match.confidence).toBe(0);
    expect(match.alternativeLinks).toBeDefined();
    expect(match.alternativeLinks!.length).toBe(3);
  });

  it("handles special characters in track names", () => {
    const track = makeTrack({ name: "SH-101 (Live)", artists: ["Robert Hood"] });
    const results = [makeResult({ title: "SH-101", artist: "Robert Hood" })];
    const match = matchTrack(track, results);

    // Should still find a reasonable match
    expect(["exact", "close"]).toContain(match.status);
  });

  it("handles very long strings without throwing", () => {
    const longName = "A".repeat(500);
    const track = makeTrack({ name: longName });
    const results = [makeResult({ title: longName, artist: "Cybotron" })];

    expect(() => matchTrack(track, results)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// generateAlternativeLinks
// ---------------------------------------------------------------------------

describe("generateAlternativeLinks", () => {
  it("returns links for beatport, juno, and traxsource", () => {
    const track = makeTrack();
    const links = generateAlternativeLinks(track);

    expect(links).toHaveLength(3);
    expect(links.map((l) => l.platform)).toEqual([
      "beatport",
      "juno",
      "traxsource",
    ]);
  });

  it("encodes the search query in URLs", () => {
    const track = makeTrack({ name: "Track & Title", artists: ["DJ Test"] });
    const links = generateAlternativeLinks(track);

    for (const link of links) {
      expect(link.searchUrl).toContain(encodeURIComponent("DJ Test Track & Title"));
    }
  });
});
