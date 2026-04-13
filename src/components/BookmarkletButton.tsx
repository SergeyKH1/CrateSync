"use client";

import { useState, useEffect, useCallback } from "react";
import type { TrackMatch } from "@/lib/types";
import { generateBookmarkletHref } from "@/lib/bookmarklet";
import type { WishlistTrack } from "@/app/api/session/route";

interface BookmarkletButtonProps {
  matches: TrackMatch[];
}

export function BookmarkletButton({ matches }: BookmarkletButtonProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const createSession = useCallback(async () => {
    // Only include tracks that have a Bandcamp match with a URL
    const wishlistTracks: WishlistTrack[] = matches
      .filter((m) => m.bandcampMatch?.url)
      .map((m) => ({
        url: m.bandcampMatch!.url.split("?")[0], // strip search params
        title: m.bandcampMatch!.title || m.track.name,
        artist: m.bandcampMatch!.artist || m.track.artists[0] || "",
        itemType: m.bandcampMatch!.type === "album" ? ("a" as const) : ("t" as const),
      }));

    if (wishlistTracks.length === 0) {
      setError("No Bandcamp matches to wishlist");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tracks: wishlistTracks }),
      });

      if (!res.ok) {
        throw new Error("Failed to create session");
      }

      const data = await res.json();
      setSessionId(data.sessionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [matches]);

  useEffect(() => {
    createSession();
  }, [createSession]);

  const matchCount = matches.filter((m) => m.bandcampMatch?.url).length;

  if (matchCount === 0) return null;

  const apiBaseUrl =
    typeof window !== "undefined" ? window.location.origin : "";
  const bookmarkletHref = sessionId
    ? generateBookmarkletHref(sessionId, apiBaseUrl)
    : "#";

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/80 p-4">
      <div className="flex items-start gap-4">
        <div className="flex-1 space-y-2">
          <h3 className="text-sm font-semibold text-gray-100">
            Wishlist with Bookmarklet
          </h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            Drag the button below to your bookmarks bar (one-time setup). Then
            go to{" "}
            <a
              href="https://bandcamp.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:underline"
            >
              bandcamp.com
            </a>
            , log in, and click the bookmark to wishlist{" "}
            <span className="font-medium text-gray-200">
              {matchCount} tracks
            </span>{" "}
            automatically.
          </p>
          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}
        </div>

        <div className="flex flex-col items-center gap-1.5">
          {loading ? (
            <div className="flex h-9 w-[180px] items-center justify-center rounded-lg bg-gray-800 text-xs text-gray-500">
              Preparing...
            </div>
          ) : sessionId ? (
            <a
              href={bookmarkletHref}
              onClick={(e) => {
                e.preventDefault();
                alert(
                  "Drag this button to your bookmarks bar instead of clicking it!"
                );
              }}
              draggable
              className="flex h-9 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white shadow-lg shadow-emerald-600/20 transition-transform hover:scale-105 hover:bg-emerald-500 cursor-grab active:cursor-grabbing select-none"
              title="Drag to your bookmarks bar"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
              CrateSync Wishlist
            </a>
          ) : (
            <div className="flex h-9 w-[180px] items-center justify-center rounded-lg bg-gray-800 text-xs text-gray-500">
              No session
            </div>
          )}
          <span className="text-[10px] text-gray-600">
            Drag to bookmarks bar
          </span>
        </div>
      </div>

      {/* Setup instructions */}
      <div className="mt-3 flex gap-6 border-t border-gray-800 pt-3">
        {[
          { step: "1", text: "Drag button to bookmarks bar" },
          { step: "2", text: "Go to bandcamp.com and log in" },
          { step: "3", text: "Click the bookmark" },
        ].map((item) => (
          <div key={item.step} className="flex items-center gap-2 text-xs text-gray-500">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-800 text-[10px] font-bold text-gray-400">
              {item.step}
            </span>
            {item.text}
          </div>
        ))}
      </div>
    </div>
  );
}
