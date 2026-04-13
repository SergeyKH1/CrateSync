"use client";

import { useState, useCallback } from "react";
import type { SyncResults, SyncProgress, PlaylistData, TrackMatch, BandcampResult } from "@/lib/types";
import { matchTrack } from "@/lib/matching";

export function usePlaylistSync(url: string) {
  const [results, setResults] = useState<SyncResults | null>(null);
  const [progress, setProgress] = useState<SyncProgress>({
    total: 0,
    completed: 0,
    status: "idle",
  });
  const [error, setError] = useState<string | null>(null);

  const startSync = useCallback(async () => {
    if (!url) return;

    setError(null);
    setResults(null);
    setProgress({ total: 0, completed: 0, status: "parsing" });

    try {
      // Step 1: Fetch playlist tracks from Spotify
      const spotifyRes = await fetch("/api/spotify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!spotifyRes.ok) {
        const data = await spotifyRes.json();
        throw new Error(data.error || "Failed to fetch playlist");
      }

      const playlist: PlaylistData = await spotifyRes.json();

      setProgress({
        total: playlist.tracks.length,
        completed: 0,
        status: "searching",
        current: playlist.tracks[0]?.name,
      });

      // Step 2: Search Bandcamp for each track individually
      const matches: TrackMatch[] = [];

      for (let i = 0; i < playlist.tracks.length; i++) {
        const track = playlist.tracks[i];

        try {
          const searchRes = await fetch("/api/bandcamp/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              query: track.name,
              artist: track.artists[0] ?? "",
            }),
          });

          const results: BandcampResult[] = searchRes.ok
            ? await searchRes.json()
            : [];

          matches.push(matchTrack(track, results));
        } catch {
          matches.push(matchTrack(track, []));
        }

        setProgress({
          total: playlist.tracks.length,
          completed: i + 1,
          current: playlist.tracks[i + 1]?.name,
          status: "searching",
        });
      }

      // Compute stats
      const stats = {
        total: matches.length,
        exact: matches.filter((m) => m.status === "exact").length,
        close: matches.filter((m) => m.status === "close").length,
        notFound: matches.filter((m) => m.status === "not_found").length,
      };

      const syncResults: SyncResults = { playlist, matches, stats };

      setResults(syncResults);
      setProgress({
        total: playlist.tracks.length,
        completed: playlist.tracks.length,
        status: "complete",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(message);
      setProgress((prev) => ({
        ...prev,
        status: "error",
        error: message,
      }));
    }
  }, [url]);

  return { results, progress, error, startSync };
}
