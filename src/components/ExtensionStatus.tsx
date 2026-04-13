"use client";

import { useExtension } from "@/hooks/useExtension";

export function ExtensionStatus() {
  const { installed, loading } = useExtension();

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span className="h-2 w-2 rounded-full bg-gray-600 animate-pulse-glow" />
        Checking extension...
      </div>
    );
  }

  if (installed) {
    return (
      <div className="flex items-center gap-2 text-sm text-emerald-400">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        Extension connected
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-amber-400">
      <span className="h-2 w-2 rounded-full bg-amber-500" />
      Install extension for one-click wishlisting
    </div>
  );
}
