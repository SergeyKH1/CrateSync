import { generateCSV } from "@/lib/csv-export";
import type { SyncResults, TrackMatch, SpotifyTrack } from "@/lib/types";

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

function makeResults(matches: TrackMatch[]): SyncResults {
  return {
    playlist: {
      name: "Test Playlist",
      trackCount: matches.length,
      tracks: matches.map((m) => m.track),
      source: "spotify",
    },
    matches,
    stats: {
      total: matches.length,
      exact: matches.filter((m) => m.status === "exact").length,
      close: matches.filter((m) => m.status === "close").length,
      notFound: matches.filter((m) => m.status === "not_found").length,
    },
  };
}

describe("generateCSV", () => {
  it("produces correct headers", () => {
    const csv = generateCSV(makeResults([]));
    const headerLine = csv.split("\n")[0];
    expect(headerLine).toBe(
      "Track,Artist,Album,Status,Confidence,Bandcamp URL,Alternative Links"
    );
  });

  it("produces correct data rows", () => {
    const match: TrackMatch = {
      track: makeTrack(),
      status: "exact",
      confidence: 95,
      bandcampMatch: {
        title: "Clear",
        artist: "Cybotron",
        album: "Clear",
        url: "https://cybotron.bandcamp.com/track/clear",
        type: "track",
      },
    };

    const csv = generateCSV(makeResults([match]));
    const lines = csv.split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain("Clear");
    expect(lines[1]).toContain("Cybotron");
    expect(lines[1]).toContain("exact");
    expect(lines[1]).toContain("95");
    expect(lines[1]).toContain("https://cybotron.bandcamp.com/track/clear");
  });

  it("escapes fields containing commas", () => {
    const match: TrackMatch = {
      track: makeTrack({ name: "Hello, World" }),
      status: "not_found",
      confidence: 0,
    };

    const csv = generateCSV(makeResults([match]));
    // The field should be wrapped in double quotes
    expect(csv).toContain('"Hello, World"');
  });

  it("escapes fields containing double quotes", () => {
    const match: TrackMatch = {
      track: makeTrack({ name: 'Say "Hello"' }),
      status: "not_found",
      confidence: 0,
    };

    const csv = generateCSV(makeResults([match]));
    // Internal quotes should be doubled and field wrapped
    expect(csv).toContain('"Say ""Hello"""');
  });

  it("handles multiple artists joined by semicolons", () => {
    const match: TrackMatch = {
      track: makeTrack({ artists: ["Artist A", "Artist B"] }),
      status: "not_found",
      confidence: 0,
    };

    const csv = generateCSV(makeResults([match]));
    // Semicolon-separated artists should appear in the row
    expect(csv).toContain("Artist A; Artist B");
  });

  it("returns only headers for empty results", () => {
    const csv = generateCSV(makeResults([]));
    const lines = csv.split("\n");
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain("Track");
  });

  it("includes alternative links when present", () => {
    const match: TrackMatch = {
      track: makeTrack(),
      status: "not_found",
      confidence: 0,
      alternativeLinks: [
        { platform: "beatport", searchUrl: "https://www.beatport.com/search?q=test" },
      ],
    };

    const csv = generateCSV(makeResults([match]));
    expect(csv).toContain("beatport");
    expect(csv).toContain("beatport.com");
  });
});
