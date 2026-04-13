import { NextRequest, NextResponse } from "next/server";
import { setSessionCookie, type SessionData } from "@/lib/auth";
import { exchangeCodeForTokens, fetchSpotifyProfile } from "@/lib/spotify-auth";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const origin = new URL(request.url).origin;

  if (error) {
    return NextResponse.redirect(`${origin}/?auth_error=${error}`);
  }

  // CSRF validation
  const storedState = request.cookies.get("oauth_state")?.value;
  if (!state || !storedState || state !== storedState) {
    return NextResponse.redirect(`${origin}/?auth_error=state_mismatch`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/?auth_error=no_code`);
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const profile = await fetchSpotifyProfile(tokens.access_token);

    const session: SessionData = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token!,
      expiresAt: Date.now() + tokens.expires_in * 1000,
      displayName: profile.displayName,
    };

    const response = NextResponse.redirect(origin);
    setSessionCookie(response, session);
    // Clear the oauth_state cookie
    response.cookies.set("oauth_state", "", { maxAge: 0, path: "/" });
    return response;
  } catch (err) {
    console.error("OAuth callback error:", err);
    return NextResponse.redirect(`${origin}/?auth_error=token_exchange`);
  }
}
