"use client";

import type { SyncProgress } from "@/lib/types";

interface ProgressBarProps {
  progress: SyncProgress;
}

export function ProgressBar({ progress }: ProgressBarProps) {
  const percentage =
    progress.total > 0
      ? Math.round((progress.completed / progress.total) * 100)
      : 0;

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-300">
          {progress.status === "parsing"
            ? "Fetching playlist..."
            : progress.current
              ? `Processing track ${progress.completed + 1} of ${progress.total}: ${progress.current}`
              : `Processing ${progress.completed} of ${progress.total}`}
        </span>
        <span className="text-gray-400 tabular-nums">{percentage}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-800">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
