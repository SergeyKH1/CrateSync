"use client";

import type { TrackMatch, MatchStatus, WishlistAction } from "@/lib/types";
import { TrackRow } from "./TrackRow";

interface TrackListProps {
  matches: TrackMatch[];
  filter: MatchStatus | "all";
  selectedIds: Set<string>;
  extensionInstalled: boolean;
  onToggleSelect: (id: string) => void;
  onPickMatch: (match: TrackMatch) => void;
  onWishlistAction: (url: string, trackName: string, action: WishlistAction) => void;
}

export function TrackList({
  matches,
  filter,
  selectedIds,
  extensionInstalled,
  onToggleSelect,
  onPickMatch,
  onWishlistAction,
}: TrackListProps) {
  const filtered =
    filter === "all"
      ? matches
      : matches.filter((m) => m.status === filter);

  if (filtered.length === 0) {
    const messages: Record<string, string> = {
      all: "No tracks to display",
      exact: "No exact matches found",
      close: "No close matches found",
      not_found: "All tracks were found!",
    };

    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-500">
        <p className="text-lg">{messages[filter]}</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-800/50">
      {filtered.map((match, idx) => (
        <TrackRow
          key={match.track.id}
          match={match}
          index={idx}
          selected={selectedIds.has(match.track.id)}
          extensionInstalled={extensionInstalled}
          onToggleSelect={onToggleSelect}
          onPickMatch={onPickMatch}
          onWishlistAction={onWishlistAction}
        />
      ))}
    </div>
  );
}
