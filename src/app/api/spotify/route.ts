import { NextRequest, NextResponse } from "next/server";
import { fetchPlaylist } from "@/lib/spotify";
import { getSession, setSessionCookie } from "@/lib/auth";
import { getValidToken } from "@/lib/spotify-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'url' field" },
        { status: 400 }
      );
    }

    // Try to get user session for private playlist access
    const session = getSession(request);
    let userToken: string | undefined;
    let updatedSession: typeof session = null;

    if (session) {
      try {
        const result = await getValidToken(session);
        userToken = result.token;
        if (result.session !== session) {
          updatedSession = result.session;
        }
      } catch {
        // Session invalid, proceed without user token
      }
    }

    const playlist = await fetchPlaylist(url, userToken);
    const response = NextResponse.json(playlist);

    if (updatedSession) {
      setSessionCookie(response, updatedSession);
    }

    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
