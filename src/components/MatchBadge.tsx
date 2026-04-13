"use client";

import type { MatchStatus } from "@/lib/types";

interface MatchBadgeProps {
  status: MatchStatus;
  confidence: number;
}

export function MatchBadge({ status, confidence }: MatchBadgeProps) {
  if (status === "exact") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
        Found
        <span className="text-emerald-500/70">{Math.round(confidence)}%</span>
      </span>
    );
  }

  if (status === "close") {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-medium text-amber-400">
        Close Match
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-gray-500/20 px-2.5 py-0.5 text-xs font-medium text-gray-400">
      Not Found
    </span>
  );
}
