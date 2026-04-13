"use client";

import { useState } from "react";
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

function getBandcampEmbedUrl(bandcampId: string, type: "track" | "album"): string {
  const kind = type === "album" ? "album" : "track";
  return `https://bandcamp.com/EmbeddedPlayer/${kind}=${bandcampId}/size=large/bgcol=0a0a0a/linkcol=10b981/tracklist=false/artwork=small/transparent=true/`;
}

function getCleanBandcampUrl(url: string): string {
  return url.split("?")[0];
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
  const [expanded, setExpanded] = useState(false);

  const hasEmbed = bandcampMatch?.bandcampId && status === "exact";
  const cleanUrl = bandcampMatch ? getCleanBandcampUrl(bandcampMatch.url) : "";

  return (
    <div className="border-b border-gray-800/50 last:border-b-0">
      {/* Main row */}
      <div
        className={`group flex items-center gap-3 px-3 py-3 transition-colors sm:gap-4 ${
          hasEmbed ? "cursor-pointer hover:bg-gray-800/60" : ""
        } ${expanded ? "bg-gray-800/40" : ""}`}
        onClick={() => hasEmbed && setExpanded(!expanded)}
      >
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => {
            e.stopPropagation();
            onToggleSelect(track.id);
          }}
          onClick={(e) => e.stopPropagation()}
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
        </div>

        {/* Badge */}
        <MatchBadge status={status} confidence={confidence} />

        {/* Action buttons */}
        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
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
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="rounded-md bg-gray-800 px-2.5 py-1 text-xs font-medium text-gray-300 transition-colors hover:bg-gray-700 cursor-pointer"
                  title="Preview & listen"
                >
                  {expanded ? "Hide" : "Preview"}
                </button>
                <a
                  href={cleanUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md bg-emerald-600/80 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-emerald-500 inline-block"
                >
                  Open on Bandcamp
                </a>
              </div>
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

      {/* Expanded embed player */}
      {expanded && hasEmbed && bandcampMatch?.bandcampId && (
        <div className="border-t border-gray-800/30 bg-gray-900/80 px-4 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            {/* Bandcamp embed player */}
            <div className="flex-1 min-w-0">
              <iframe
                src={getBandcampEmbedUrl(bandcampMatch.bandcampId, bandcampMatch.type)}
                seamless
                className="w-full rounded-lg border-0"
                style={{ height: "120px" }}
                title={`${bandcampMatch.title} by ${bandcampMatch.artist}`}
              />
            </div>

            {/* Action buttons for embed view */}
            <div className="flex flex-col gap-2 sm:w-48">
              <a
                href={cleanUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-500"
              >
                Open on Bandcamp
              </a>
              {bandcampMatch.price && (
                <p className="text-center text-xs text-gray-400">
                  {bandcampMatch.price}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
