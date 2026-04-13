import crypto from "crypto";
import { NextResponse } from "next/server";
import { getSpotifyAuthUrl } from "@/lib/spotify-auth";

export async function GET() {
  const state = crypto.randomBytes(16).toString("hex");

  const response = NextResponse.redirect(getSpotifyAuthUrl(state));
  response.cookies.set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 300, // 5 minutes
  });

  return response;
}
