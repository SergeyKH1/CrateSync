import { NextRequest } from "next/server";
import { rateLimitedSearch } from "@/lib/bandcamp";
import { matchTrack } from "@/lib/matching";
import { SpotifyTrack, TrackMatch } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tracks } = body;

    if (!Array.isArray(tracks) || tracks.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'tracks' array" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Use a streaming response so the frontend can show progress
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        for (let i = 0; i < tracks.length; i++) {
          const track: SpotifyTrack = tracks[i];

          let match: TrackMatch;
          try {
            const searchQuery = track.name;
            const searchArtist = track.artists[0] ?? "";
            const results = await rateLimitedSearch(
              searchQuery,
              searchArtist
            );
            match = matchTrack(track, results);
          } catch {
            // If search fails for one track, mark as not found
            match = {
              track,
              status: "not_found",
              confidence: 0,
              alternativeLinks: [],
            };
          }

          // Send each match as a newline-delimited JSON chunk
          const chunk = JSON.stringify({
            index: i,
            total: tracks.length,
            match,
          });
          controller.enqueue(encoder.encode(chunk + "\n"));
        }

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
