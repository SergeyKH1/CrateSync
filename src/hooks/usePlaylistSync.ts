"use client";

import { useState, useCallback } from "react";
import type { SyncResults, SyncProgress } from "@/lib/types";

/**
 * Stub: orchestrate playlist sync flow.
 * Will be fully implemented by the frontend agent.
 */
export function usePlaylistSync(_url: string) {
  const [results, setResults] = useState<SyncResults | null>(null);
  const [progress, setProgress] = useState<SyncProgress>({
    total: 0,
    completed: 0,
    status: "idle",
  });
  const [error, setError] = useState<string | null>(null);

  const startSync = useCallback(() => {
    // stub - no-op; suppress unused setters
    void setResults;
    void setProgress;
    void setError;
  }, []);

  return { results, progress, error, startSync };
}
