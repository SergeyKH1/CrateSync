"use client";

import { useEffect, useCallback } from "react";
import type { BandcampResult } from "@/lib/types";

interface MatchResolutionModalProps {
  trackName: string;
  options: BandcampResult[];
  onSelect: (result: BandcampResult) => void;
  onSkip: () => void;
}

export function MatchResolutionModal({
  trackName,
  options,
  onSelect,
  onSkip,
}: MatchResolutionModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onSkip();
    },
    [onSkip]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg rounded-xl bg-gray-900 border border-gray-800 shadow-2xl">
        <div className="border-b border-gray-800 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-100">
            Select the correct match
          </h2>
          <p className="mt-1 text-sm text-gray-400 truncate">
            for &ldquo;{trackName}&rdquo;
          </p>
        </div>

        <div className="max-h-80 overflow-y-auto p-4 space-y-3">
          {options.slice(0, 3).map((option, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-800/50 p-4 transition-colors hover:border-gray-700 hover:bg-gray-800"
            >
              <div className="min-w-0 flex-1 mr-3">
                <p className="font-medium text-gray-100 truncate">
                  {option.title}
                </p>
                <p className="text-sm text-gray-400 truncate">
                  {option.artist}
                </p>
                {option.album && (
                  <p className="text-xs text-gray-500 truncate">
                    {option.album}
                  </p>
                )}
                {option.price && (
                  <p className="mt-1 text-xs font-medium text-emerald-400">
                    {option.price}
                  </p>
                )}
              </div>
              <button
                onClick={() => onSelect(option)}
                className="shrink-0 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500 cursor-pointer"
              >
                Select
              </button>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-800 px-6 py-4 flex justify-end">
          <button
            onClick={onSkip}
            className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-400 transition-colors hover:border-gray-500 hover:text-gray-200 cursor-pointer"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
