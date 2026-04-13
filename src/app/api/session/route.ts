import { NextRequest, NextResponse } from "next/server";

export interface WishlistTrack {
  url: string;
  title: string;
  artist: string;
  itemType: "t" | "a";
}

interface SessionData {
  tracks: WishlistTrack[];
  createdAt: number;
}

const sessions = new Map<string, SessionData>();

const SESSION_TTL_MS = 60 * 60 * 1000; // 1 hour

function generateId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  for (let i = 0; i < 16; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

function cleanupExpired() {
  const now = Date.now();
  for (const [id, data] of sessions) {
    if (now - data.createdAt > SESSION_TTL_MS) {
      sessions.delete(id);
    }
  }
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  cleanupExpired();

  let body: { tracks?: WishlistTrack[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON" },
      { status: 400, headers: corsHeaders }
    );
  }

  if (!body.tracks || !Array.isArray(body.tracks) || body.tracks.length === 0) {
    return NextResponse.json(
      { error: "tracks array is required and must not be empty" },
      { status: 400, headers: corsHeaders }
    );
  }

  const sessionId = generateId();
  sessions.set(sessionId, {
    tracks: body.tracks,
    createdAt: Date.now(),
  });

  // Schedule cleanup
  setTimeout(() => {
    sessions.delete(sessionId);
  }, SESSION_TTL_MS);

  return NextResponse.json(
    { sessionId, trackCount: body.tracks.length },
    { headers: corsHeaders }
  );
}

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json(
      { error: "id parameter required" },
      { status: 400, headers: corsHeaders }
    );
  }

  const session = sessions.get(id);
  if (!session) {
    return NextResponse.json(
      { error: "Session not found or expired" },
      { status: 404, headers: corsHeaders }
    );
  }

  return NextResponse.json(
    { tracks: session.tracks },
    { headers: corsHeaders }
  );
}
