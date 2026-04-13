"use client";

import type { TrackMatch } from "@/lib/types";

interface ExportButtonProps {
  matches: TrackMatch[];
}

export function ExportButton({ matches }: ExportButtonProps) {
  const handleExport = () => {
    const header = "Track,Artist,Album,Status,Bandcamp URL";
    const rows = matches.map((m) => {
      const track = m.track.name.replace(/,/g, " ");
      const artist = m.track.artists.join(" & ").replace(/,/g, " ");
      const album = m.track.album.replace(/,/g, " ");
      const status =
        m.status === "exact"
          ? "Found"
          : m.status === "close"
            ? "Close Match"
            : "Not Found";
      const bcUrl = m.bandcampMatch?.url || "";
      return `${track},${artist},${album},${status},${bcUrl}`;
    });

    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "cratesync-results.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleExport}
      className="inline-flex items-center gap-2 rounded-lg border border-gray-700 px-3 py-1.5 text-sm text-gray-300 transition-colors hover:border-gray-500 hover:text-gray-100 cursor-pointer"
    >
      <svg
        className="h-4 w-4"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
          clipRule="evenodd"
        />
      </svg>
      Export CSV
    </button>
  );
}
