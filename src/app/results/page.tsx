"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import type { MatchStatus, TrackMatch, BandcampResult, WishlistAction } from "@/lib/types";
import { usePlaylistSync } from "@/hooks/usePlaylistSync";
import { useExtension } from "@/hooks/useExtension";
import { TrackList } from "@/components/TrackList";
import { ProgressBar } from "@/components/ProgressBar";
import { ExportButton } from "@/components/ExportButton";
import { ExtensionStatus } from "@/components/ExtensionStatus";
import { MatchResolutionModal } from "@/components/MatchResolutionModal";
import { GuidedWishlistFlow } from "@/components/GuidedWishlistFlow";
import { BookmarkletButton } from "@/components/BookmarkletButton";
import { SpotifyLoginButton } from "@/components/SpotifyLoginButton";

function ResultsContent() {
  const searchParams = useSearchParams();
  const url = searchParams.get("url") || "";
  const { results, progress, error, startSync } = usePlaylistSync(url);
  const { installed: extensionInstalled } = useExtension();

  const [filter, setFilter] = useState<MatchStatus | "all">("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [modalTrack, setModalTrack] = useState<TrackMatch | null>(null);
  const [showGuidedFlow, setShowGuidedFlow] = useState(false);
  const [guidedFlowMessage, setGuidedFlowMessage] = useState<string | null>(null);

  useEffect(() => {
    if (url) startSync();
  }, [url, startSync]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (!results) return;
    const currentMatches =
      filter === "all"
        ? results.matches
        : results.matches.filter((m) => m.status === filter);
    const allIds = currentMatches.map((m) => m.track.id);
    const allSelected = allIds.every((id) => selectedIds.has(id));

    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        allIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        allIds.forEach((id) => next.add(id));
        return next;
      });
    }
  }, [results, filter, selectedIds]);

  const handleWishlistAction = useCallback(
    (bcUrl: string, trackName: string, action: WishlistAction) => {
      // Strip Bandcamp search params to get a clean URL
      const cleanUrl = bcUrl.split("?")[0];

      // Try the Chrome extension if available
      if (
        typeof chrome !== "undefined" &&
        chrome?.runtime?.sendMessage
      ) {
        try {
          chrome.runtime.sendMessage(
            // The extension ID will be set after Chrome Web Store publish.
            // For local development, use the ID from chrome://extensions
            localStorage.getItem("cratesync_extension_id") || "",
            {
              type: "CRATESYNC_ADD",
              action,
              url: cleanUrl,
              trackName,
            },
            (response: { success?: boolean } | undefined) => {
              if (!response?.success) {
                // Extension not available or failed — open link directly
                window.open(cleanUrl, "_blank");
              }
            }
          );
          return;
        } catch {
          // Extension messaging failed
        }
      }

      // Fallback: open the Bandcamp page directly
      window.open(cleanUrl, "_blank");
    },
    []
  );

  const handleBulkAction = useCallback(
    (action: WishlistAction) => {
      if (!results) return;
      results.matches
        .filter(
          (m) => selectedIds.has(m.track.id) && m.bandcampMatch
        )
        .forEach((m) => {
          if (m.bandcampMatch) {
            handleWishlistAction(m.bandcampMatch.url, m.track.name, action);
          }
        });
    },
    [results, selectedIds, handleWishlistAction]
  );

  const handlePickMatch = useCallback((match: TrackMatch) => {
    setModalTrack(match);
  }, []);

  const handleModalSelect = useCallback(
    (_result: BandcampResult) => {
      setModalTrack(null);
    },
    []
  );

  const isLoading =
    progress.status === "parsing" || progress.status === "searching";

  const filters: { key: MatchStatus | "all"; label: string; color: string; count?: number }[] = [
    { key: "all", label: "All", color: "text-gray-100", count: results?.stats.total },
    { key: "exact", label: "Found", color: "text-emerald-400", count: results?.stats.exact },
    { key: "close", label: "Close Matches", color: "text-amber-400", count: results?.stats.close },
    { key: "not_found", label: "Not Found", color: "text-gray-400", count: results?.stats.notFound },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-gray-800 bg-gray-950/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent"
            >
              CrateSync
            </a>
            {results && (
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-400">
                <span className="text-gray-700">/</span>
                <span className="truncate max-w-[200px]">{results.playlist.name}</span>
                <span className="text-gray-600">
                  ({results.playlist.trackCount} tracks)
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {results && <ExportButton matches={results.matches} />}
            <ExtensionStatus />
            <SpotifyLoginButton />
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        {/* Error state */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
            <p className="text-sm text-red-400">{error}</p>
            <button
              onClick={startSync}
              className="mt-2 text-sm text-red-300 underline hover:text-red-200 cursor-pointer"
            >
              Try again
            </button>
          </div>
        )}

        {/* Progress overlay */}
        {isLoading && (
          <div className="mb-6">
            <ProgressBar progress={progress} />
          </div>
        )}

        {/* Results */}
        {results && (
          <>
            {/* Summary stats bar */}
            <div className="mb-6 space-y-3">
              <p className="text-sm text-gray-300">
                <span className="font-semibold text-gray-100">
                  {results.stats.exact}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-gray-100">
                  {results.stats.total}
                </span>{" "}
                tracks found on Bandcamp
              </p>

              {/* Breakdown bar */}
              <div className="flex h-2 overflow-hidden rounded-full bg-gray-800">
                {results.stats.exact > 0 && (
                  <div
                    className="bg-emerald-500 transition-all"
                    style={{
                      width: `${(results.stats.exact / results.stats.total) * 100}%`,
                    }}
                  />
                )}
                {results.stats.close > 0 && (
                  <div
                    className="bg-amber-500 transition-all"
                    style={{
                      width: `${(results.stats.close / results.stats.total) * 100}%`,
                    }}
                  />
                )}
                {results.stats.notFound > 0 && (
                  <div
                    className="bg-gray-600 transition-all"
                    style={{
                      width: `${(results.stats.notFound / results.stats.total) * 100}%`,
                    }}
                  />
                )}
              </div>
            </div>

            {/* Bookmarklet */}
            <div className="mb-6">
              <BookmarkletButton matches={results.matches} />
            </div>

            {/* Filter tabs */}
            <div className="mb-4 flex items-center gap-1 border-b border-gray-800">
              {filters.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`cursor-pointer px-3 py-2 text-sm font-medium transition-colors border-b-2 ${
                    filter === f.key
                      ? `${f.color} border-current`
                      : "text-gray-500 border-transparent hover:text-gray-300"
                  }`}
                >
                  {f.label}
                  {f.count !== undefined && (
                    <span className="ml-1.5 text-xs opacity-70">{f.count}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Bulk action bar */}
            <div className="mb-3 hidden items-center gap-3 sm:flex">
              <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                <input
                  type="checkbox"
                  onChange={toggleSelectAll}
                  checked={
                    results.matches.length > 0 &&
                    (filter === "all"
                      ? results.matches
                      : results.matches.filter((m) => m.status === filter)
                    ).every((m) => selectedIds.has(m.track.id))
                  }
                  className="h-4 w-4 rounded border-gray-600 bg-gray-800 accent-emerald-500"
                />
                Select All
              </label>

              {selectedIds.size > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    {selectedIds.size} selected
                  </span>
                  <button
                    onClick={() => handleBulkAction("wishlist")}
                    className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-emerald-500 cursor-pointer"
                  >
                    Add to Wishlist
                  </button>
                  <button
                    onClick={() => handleBulkAction("cart")}
                    className="rounded-md border border-emerald-600 px-3 py-1 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-600/20 cursor-pointer"
                  >
                    Add to Cart
                  </button>
                </div>
              )}

              {results.stats.exact > 0 && (
                <button
                  onClick={() => setShowGuidedFlow(true)}
                  className="ml-auto rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-500 cursor-pointer flex items-center gap-1.5"
                >
                  <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Quick Add All
                </button>
              )}
            </div>

            {/* Guided flow completion message */}
            {guidedFlowMessage && (
              <div className="mb-3 flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5">
                <p className="text-sm text-emerald-300">{guidedFlowMessage}</p>
                <button
                  onClick={() => setGuidedFlowMessage(null)}
                  className="ml-3 shrink-0 text-emerald-400 hover:text-emerald-300 cursor-pointer"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {/* Track list */}
            <div className="rounded-lg border border-gray-800 bg-gray-900/50">
              <TrackList
                matches={results.matches}
                filter={filter}
                selectedIds={selectedIds}
                extensionInstalled={extensionInstalled}
                onToggleSelect={toggleSelect}
                onPickMatch={handlePickMatch}
                onWishlistAction={handleWishlistAction}
              />
            </div>
          </>
        )}

        {/* Empty state when no URL */}
        {!url && !isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <p className="text-lg">No playlist URL provided</p>
            <a
              href="/"
              className="mt-2 text-sm text-emerald-400 hover:text-emerald-300"
            >
              Go back and paste a playlist URL
            </a>
          </div>
        )}
      </div>

      {/* Match resolution modal */}
      {modalTrack && modalTrack.closeMatches && (
        <MatchResolutionModal
          trackName={modalTrack.track.name}
          options={modalTrack.closeMatches}
          onSelect={handleModalSelect}
          onSkip={() => setModalTrack(null)}
        />
      )}

      {/* Guided wishlist flow */}
      {showGuidedFlow && results && (
        <GuidedWishlistFlow
          tracks={results.matches
            .filter((m) => m.status === "exact" && m.bandcampMatch)
            .map((m) => ({
              trackName: m.track.name,
              artistName: m.bandcampMatch!.artist,
              bandcampUrl: m.bandcampMatch!.url,
              imageUrl: m.bandcampMatch!.imageUrl,
            }))}
          onClose={() => setShowGuidedFlow(false)}
          onComplete={(r) => {
            setShowGuidedFlow(false);
            setGuidedFlowMessage(
              `Done! ${r.wishlisted} track${r.wishlisted !== 1 ? "s" : ""} wishlisted` +
                (r.skipped > 0 ? `, ${r.skipped} skipped` : "")
            );
          }}
        />
      )}
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <svg
              className="animate-spin h-8 w-8 text-emerald-500"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <p className="text-sm text-gray-400">Loading results...</p>
          </div>
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}
