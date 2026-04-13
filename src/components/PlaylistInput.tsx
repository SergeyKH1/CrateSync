"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

const SPOTIFY_PLAYLIST_REGEX = /spotify\.com\/playlist\//i;

export function PlaylistInput() {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!url.trim()) {
      setError("Please enter a playlist URL");
      return;
    }

    if (!SPOTIFY_PLAYLIST_REGEX.test(url)) {
      setError("Please enter a valid Spotify playlist URL (e.g. https://open.spotify.com/playlist/...)");
      return;
    }

    setLoading(true);
    router.push(`/results?url=${encodeURIComponent(url.trim())}`);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="url"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            if (error) setError(null);
          }}
          placeholder="Paste your Spotify playlist URL..."
          disabled={loading}
          className="flex-1 rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-base text-gray-100 placeholder-gray-500 outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
        >
          {loading ? (
            <>
              <svg
                className="animate-spin h-5 w-5"
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
              Syncing...
            </>
          ) : (
            "Sync Playlist"
          )}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-400 mt-1">{error}</p>
      )}
    </form>
  );
}
