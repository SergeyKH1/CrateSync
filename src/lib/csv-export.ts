import type { SyncResults } from "@/lib/types";

/**
 * Escape a single CSV field. If the value contains a comma, double-quote,
 * or newline, wrap it in double quotes and escape internal quotes.
 */
function escapeField(value: string): string {
  if (
    value.includes(",") ||
    value.includes('"') ||
    value.includes("\n") ||
    value.includes("\r")
  ) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

const HEADERS = [
  "Track",
  "Artist",
  "Album",
  "Status",
  "Confidence",
  "Bandcamp URL",
  "Alternative Links",
];

/**
 * Generate a CSV string from sync results.
 */
export function generateCSV(results: SyncResults): string {
  const rows: string[] = [HEADERS.join(",")];

  for (const match of results.matches) {
    const artists = match.track.artists.join("; ");
    const bandcampUrl = match.bandcampMatch?.url ?? "";
    const altLinks = (match.alternativeLinks ?? [])
      .map((l) => `${l.platform}: ${l.searchUrl}`)
      .join(" | ");

    const row = [
      escapeField(match.track.name),
      escapeField(artists),
      escapeField(match.track.album),
      match.status,
      String(match.confidence),
      escapeField(bandcampUrl),
      escapeField(altLinks),
    ].join(",");

    rows.push(row);
  }

  return rows.join("\n");
}
