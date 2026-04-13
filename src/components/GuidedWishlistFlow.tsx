"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface GuidedWishlistTrack {
  trackName: string;
  artistName: string;
  bandcampUrl: string;
  imageUrl?: string;
}

interface GuidedWishlistFlowProps {
  tracks: GuidedWishlistTrack[];
  onClose: () => void;
  onComplete: (results: { wishlisted: number; skipped: number }) => void;
}

type TrackResult = "wishlisted" | "skipped" | "pending";

export function GuidedWishlistFlow({
  tracks,
  onClose,
  onComplete,
}: GuidedWishlistFlowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [trackResults, setTrackResults] = useState<TrackResult[]>(
    () => tracks.map(() => "pending")
  );
  const [isComplete, setIsComplete] = useState(false);
  const popupRef = useRef<Window | null>(null);

  const currentTrack = tracks[currentIndex];
  const cleanUrl = currentTrack?.bandcampUrl.split("?")[0] ?? "";

  const wishlistedCount = trackResults.filter((r) => r === "wishlisted").length;
  const skippedCount = trackResults.filter((r) => r === "skipped").length;
  const processedCount = wishlistedCount + skippedCount;

  // Close popup on unmount
  useEffect(() => {
    return () => {
      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.close();
      }
    };
  }, []);

  // Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const openPopup = useCallback(
    (url: string) => {
      if (popupRef.current && !popupRef.current.closed) {
        try {
          popupRef.current.location.href = url;
          popupRef.current.focus();
          return;
        } catch {
          // Cross-origin or closed — reopen
        }
      }
      popupRef.current = window.open(
        url,
        "cratesync_bandcamp",
        "width=800,height=700,scrollbars=yes,resizable=yes"
      );
    },
    []
  );

  const handleOpenBandcamp = useCallback(() => {
    openPopup(cleanUrl);
  }, [openPopup, cleanUrl]);

  const advanceOrFinish = useCallback(
    (nextIndex: number) => {
      if (nextIndex >= tracks.length) {
        setIsComplete(true);
        if (popupRef.current && !popupRef.current.closed) {
          popupRef.current.close();
        }
      } else {
        setCurrentIndex(nextIndex);
        const nextUrl = tracks[nextIndex].bandcampUrl.split("?")[0];
        openPopup(nextUrl);
      }
    },
    [tracks, openPopup]
  );

  const handleWishlisted = useCallback(() => {
    setTrackResults((prev) => {
      const next = [...prev];
      next[currentIndex] = "wishlisted";
      return next;
    });
    advanceOrFinish(currentIndex + 1);
  }, [currentIndex, advanceOrFinish]);

  const handleSkip = useCallback(() => {
    setTrackResults((prev) => {
      const next = [...prev];
      next[currentIndex] = "skipped";
      return next;
    });
    advanceOrFinish(currentIndex + 1);
  }, [currentIndex, advanceOrFinish]);

  const handleFinish = useCallback(() => {
    onComplete({ wishlisted: wishlistedCount, skipped: skippedCount });
  }, [onComplete, wishlistedCount, skippedCount]);

  if (isComplete) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
        <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-950 shadow-2xl">
          <div className="flex flex-col items-center px-8 py-10 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
              <svg
                className="h-8 w-8 text-emerald-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <h2 className="text-xl font-bold text-gray-100">All done!</h2>
            <p className="mt-2 text-sm text-gray-400">
              {wishlistedCount} track{wishlistedCount !== 1 ? "s" : ""} wishlisted
              {skippedCount > 0 && (
                <span>
                  , {skippedCount} skipped
                </span>
              )}
            </p>

            {/* Summary list */}
            <div className="mt-6 w-full max-h-48 overflow-y-auto space-y-1.5 text-left">
              {tracks.map((track, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm bg-gray-900/50"
                >
                  {trackResults[idx] === "wishlisted" ? (
                    <span className="shrink-0 text-emerald-400" title="Wishlisted">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                  ) : (
                    <span className="shrink-0 text-gray-600" title="Skipped">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                      </svg>
                    </span>
                  )}
                  <span className="truncate text-gray-300">{track.trackName}</span>
                  <span className="ml-auto shrink-0 text-xs text-gray-500">{track.artistName}</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleFinish}
              className="mt-6 w-full rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="flex w-full max-w-lg flex-col rounded-2xl border border-gray-800 bg-gray-950 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-100">
              Quick Add to Wishlist
            </h2>
            <p className="mt-0.5 text-sm text-gray-400">
              Track {currentIndex + 1} of {tracks.length}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-800 hover:text-gray-300 cursor-pointer"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-800">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${(processedCount / tracks.length) * 100}%` }}
          />
        </div>

        {/* Track info */}
        <div className="flex-1 px-6 py-6">
          <div className="flex items-start gap-4">
            {currentTrack.imageUrl ? (
              <img
                src={currentTrack.imageUrl}
                alt={currentTrack.trackName}
                className="h-20 w-20 shrink-0 rounded-lg border border-gray-800 object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border border-gray-800 bg-gray-800">
                <svg className="h-8 w-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
            )}
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-gray-100 truncate">
                {currentTrack.trackName}
              </h3>
              <p className="mt-0.5 text-sm text-gray-400 truncate">
                {currentTrack.artistName}
              </p>
            </div>
          </div>

          {/* Open on Bandcamp button */}
          <button
            onClick={handleOpenBandcamp}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[#1da0c3] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#179ab8] cursor-pointer"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Open on Bandcamp
          </button>

          {/* Instructions */}
          <div className="mt-5 rounded-lg border border-gray-800 bg-gray-900/60 px-4 py-3">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 shrink-0 text-lg">&#10084;&#65039;</span>
              <div>
                <p className="text-sm font-medium text-gray-200">
                  Click the Wishlist button on the Bandcamp page
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Then come back here and click &ldquo;Next Track&rdquo;
                </p>
              </div>
            </div>
          </div>

          {/* Waiting indicator */}
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Waiting for you to wishlist...
          </div>
        </div>

        {/* Action bar */}
        <div className="flex items-center justify-between border-t border-gray-800 px-6 py-4">
          <button
            onClick={handleSkip}
            className="rounded-lg border border-gray-700 px-4 py-2.5 text-sm text-gray-400 transition-colors hover:border-gray-500 hover:text-gray-200 cursor-pointer"
          >
            Skip
          </button>
          <button
            onClick={handleWishlisted}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 cursor-pointer"
          >
            {currentIndex < tracks.length - 1 ? (
              <>
                Next Track
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            ) : (
              "Mark as Done"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
