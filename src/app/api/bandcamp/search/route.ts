import { NextRequest, NextResponse } from "next/server";
import { rateLimitedSearch } from "@/lib/bandcamp";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, artist } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'query' field" },
        { status: 400 }
      );
    }

    const results = await rateLimitedSearch(
      query,
      typeof artist === "string" ? artist : ""
    );
    return NextResponse.json(results);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
