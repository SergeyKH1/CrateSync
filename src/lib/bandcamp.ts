import type { BandcampResult } from "@/lib/types";

/**
 * Search Bandcamp for tracks matching a query.
 * Fetches the search page server-side and parses the HTML results.
 */
export async function searchBandcamp(
  query: string,
  artist: string
): Promise<BandcampResult[]> {
  const searchQuery = `${query} ${artist}`.trim();
  const url = `https://bandcamp.com/search?q=${encodeURIComponent(searchQuery)}&item_type=t`;

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });

  if (!res.ok) {
    throw new Error(`Bandcamp search failed: ${res.status}`);
  }

  const html = await res.text();
  return parseBandcampResults(html);
}

/**
 * Parse Bandcamp search result HTML into structured results.
 * Each result is in a <li class="searchresult ..."> block.
 */
function parseBandcampResults(html: string): BandcampResult[] {
  const results: BandcampResult[] = [];

  // Split on search result items
  const itemBlocks = html.split(/class="searchresult\s+/);

  for (let i = 1; i < itemBlocks.length; i++) {
    const block = itemBlocks[i];

    // Determine type from the class (track or album)
    const typeMatch = block.match(/^(\w+)/);
    const type = typeMatch?.[1] === "album" ? "album" : "track";

    // Extract heading (track/album title)
    const headingMatch = block.match(
      /class="heading"[^>]*>\s*<a[^>]*>([\s\S]*?)<\/a>/
    );
    const title = headingMatch
      ? headingMatch[1].replace(/<[^>]+>/g, "").trim()
      : "";

    // Extract subhead (artist name, sometimes "by Artist" or "from Album by Artist")
    const subheadMatch = block.match(
      /class="subhead"[^>]*>([\s\S]*?)<\/div>/
    );
    const subheadText = subheadMatch
      ? subheadMatch[1].replace(/<[^>]+>/g, "").trim()
      : "";

    // Parse artist and album from subhead
    // Typical formats:
    //   "by ArtistName"
    //   "from AlbumName by ArtistName"
    let artistName = "";
    let albumName = "";

    const fromByMatch = subheadText.match(/from\s+(.+?)\s+by\s+(.+)/i);
    if (fromByMatch) {
      albumName = fromByMatch[1].trim();
      artistName = fromByMatch[2].trim();
    } else {
      const byMatch = subheadText.match(/by\s+(.+)/i);
      if (byMatch) {
        artistName = byMatch[1].trim();
      }
    }

    // Extract URL
    const urlMatch = block.match(
      /class="itemurl"[^>]*>\s*<a[^>]*href="([^"]+)"/
    );
    const itemUrl = urlMatch ? urlMatch[1].trim() : "";

    // Extract image
    const imgMatch = block.match(
      /class="art"[\s\S]*?<img[^>]+src="([^"]+)"/
    );
    const imageUrl = imgMatch ? imgMatch[1].trim() : undefined;

    // Extract price if available
    const priceMatch = block.match(
      /class="price"[^>]*>([\s\S]*?)<\/span>/
    );
    const price = priceMatch
      ? priceMatch[1].replace(/<[^>]+>/g, "").trim() || undefined
      : undefined;

    if (title && itemUrl) {
      results.push({
        title,
        artist: artistName,
        album: albumName,
        url: itemUrl,
        imageUrl,
        price,
        type,
      });
    }
  }

  return results;
}

// Rate limiter: enforces a minimum delay between search calls
let lastCallTime = 0;
const MIN_DELAY_MS = 2000;

/**
 * Rate-limited version of searchBandcamp.
 * Ensures at least 2 seconds between consecutive calls.
 */
export async function rateLimitedSearch(
  query: string,
  artist: string
): Promise<BandcampResult[]> {
  const now = Date.now();
  const elapsed = now - lastCallTime;

  if (elapsed < MIN_DELAY_MS) {
    await new Promise((resolve) =>
      setTimeout(resolve, MIN_DELAY_MS - elapsed)
    );
  }

  lastCallTime = Date.now();
  return searchBandcamp(query, artist);
}
