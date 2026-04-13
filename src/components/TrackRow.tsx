"use client";

import type { TrackMatch, WishlistAction } from "@/lib/types";
import { MatchBadge } from "./MatchBadge";

interface TrackRowProps {
  match: TrackMatch;
  index: number;
  selected: boolean;
  extensionInstalled: boolean;
  onToggleSelect: (id: string) => void;
  onPickMatch: (match: TrackMatch) => void;
  onWishlistAction: (url: string, trackName: string, action: WishlistAction) => void;
}

export function TrackRow({
  match,
  index,
  selected,
  extensionInstalled,
  onToggleSelect,
  onPickMatch,
  onWishlistAction,
}: TrackRowProps) {
  const { track, status, confidence, bandcampMatch, alternativeLinks } = match;

  return (
    <div className="group flex items-center gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-gray-800/60 sm:gap-4">
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onToggleSelect(track.id)}
        className="h-4 w-4 shrink-0 rounded border-gray-600 bg-gray-800 text-emerald-500 accent-emerald-500 cursor-pointer"
      />

      {/* Track number */}
      <span className="hidden w-8 shrink-0 text-right text-sm text-gray-500 tabular-nums sm:block">
        {index + 1}
      </span>

      {/* Track info */}
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-gray-100">{track.name}</p>
        <p className="truncate text-sm text-gray-400">
          {track.artists.join(", ")}
        </p>
        <p className="truncate text-xs text-gray-500">{track.album}</p>
      </div>

      {/* Badge */}
      <MatchBadge status={status} confidence={confidence} />

      {/* Action button */}
      <div className="shrink-0">
        {status === "exact" && bandcampMatch && (
          extensionInstalled ? (
            <div className="flex gap-1">
              <button
                onClick={() =>
                  onWishlistAction(bandcampMatch.url, track.name, "wishlist")
                }
                className="rounded-md bg-emerald-600/80 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-emerald-500 cursor-pointer"
              >
                + Wishlist
              </button>
              <button
                onClick={() =>
                  onWishlistAction(bandcampMatch.url, track.name, "cart")
                }
                className="hidden rounded-md bg-emerald-600/40 px-2.5 py-1 text-xs font-medium text-emerald-300 transition-colors hover:bg-emerald-600/60 sm:block cursor-pointer"
              >
                + Cart
              </button>
            </div>
          ) : (
            <a
              href={bandcampMatch.url.split("?")[0]}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md bg-emerald-600/80 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-emerald-500 inline-block"
            >
              Open on Bandcamp
            </a>
          )
        )}

        {status === "close" && (
          <button
            onClick={() => onPickMatch(match)}
            className="rounded-md bg-amber-500/20 px-2.5 py-1 text-xs font-medium text-amber-400 transition-colors hover:bg-amber-500/30 cursor-pointer"
          >
            Pick Match
          </button>
        )}

        {status === "not_found" && alternativeLinks && alternativeLinks.length > 0 && (
          <div className="flex gap-1">
            {alternativeLinks.map((link) => (
              <a
                key={link.platform}
                href={link.searchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md bg-gray-800 px-2 py-1 text-xs text-gray-400 transition-colors hover:bg-gray-700 hover:text-gray-200"
              >
                {link.platform}
              </a>
            ))}
          </div>
        )}

        {status === "not_found" && (!alternativeLinks || alternativeLinks.length === 0) && (
          <span className="text-xs text-gray-600">--</span>
        )}
      </div>
    </div>
  );
}
