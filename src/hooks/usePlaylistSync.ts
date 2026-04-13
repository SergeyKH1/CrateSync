"use client";

import { useState, useCallback } from "react";
import type { SyncResults, SyncProgress, PlaylistData, TrackMatch } from "@/lib/types";

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

      // Step 2: Search Bandcamp for matches (streaming response)
      const batchRes = await fetch("/api/bandcamp/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tracks: playlist.tracks }),
      });

      if (!batchRes.ok) {
        const data = await batchRes.json();
        throw new Error(data.error || "Failed to search Bandcamp");
      }

      const matches: TrackMatch[] = [];

      // Try streaming response
      if (batchRes.body) {
        const reader = batchRes.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            try {
              const event = JSON.parse(trimmed);

              if (event.type === "progress") {
                setProgress({
                  total: playlist.tracks.length,
                  completed: event.completed,
                  current: event.current,
                  status: "searching",
                });
              } else if (event.type === "match") {
                matches.push(event.data as TrackMatch);
              }
            } catch {
              // Skip malformed JSON lines
            }
          }
        }
      } else {
        // Fallback: non-streaming response
        const data = await batchRes.json();
        matches.push(...(data.matches || []));
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
