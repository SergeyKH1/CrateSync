import { parseSpotifyUrl } from "@/lib/spotify";

describe("parseSpotifyUrl", () => {
  it("parses a standard playlist URL", () => {
    const result = parseSpotifyUrl(
      "https://open.spotify.com/playlist/6rqhFgbbKwnb9MLmUQDhG6"
    );
    expect(result).toEqual({ type: "playlist", id: "6rqhFgbbKwnb9MLmUQDhG6" });
  });

  it("parses a playlist URL with query params", () => {
    const result = parseSpotifyUrl(
      "https://open.spotify.com/playlist/6rqhFgbbKwnb9MLmUQDhG6?si=abc123"
    );
    expect(result).toEqual({ type: "playlist", id: "6rqhFgbbKwnb9MLmUQDhG6" });
  });

  it("parses a Spotify URI format", () => {
    const result = parseSpotifyUrl("spotify:playlist:6rqhFgbbKwnb9MLmUQDhG6");
    expect(result).toEqual({ type: "playlist", id: "6rqhFgbbKwnb9MLmUQDhG6" });
  });

  it("parses a track URL", () => {
    const result = parseSpotifyUrl(
      "https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC"
    );
    expect(result).toEqual({ type: "track", id: "4uLU6hMCjMI75M1A2tKUQC" });
  });

  it("parses an album URL", () => {
    const result = parseSpotifyUrl(
      "https://open.spotify.com/album/1DFixLWuPkv3KT3TnV35m3"
    );
    expect(result).toEqual({ type: "album", id: "1DFixLWuPkv3KT3TnV35m3" });
  });

  it("parses a track URI", () => {
    const result = parseSpotifyUrl("spotify:track:4uLU6hMCjMI75M1A2tKUQC");
    expect(result).toEqual({ type: "track", id: "4uLU6hMCjMI75M1A2tKUQC" });
  });

  it("parses a URL with /intl-xx/ prefix", () => {
    const result = parseSpotifyUrl(
      "https://open.spotify.com/intl-de/playlist/6rqhFgbbKwnb9MLmUQDhG6"
    );
    expect(result).toEqual({ type: "playlist", id: "6rqhFgbbKwnb9MLmUQDhG6" });
  });

  it("returns null for an empty string", () => {
    expect(parseSpotifyUrl("")).toBeNull();
  });

  it("returns null for random text", () => {
    expect(parseSpotifyUrl("not a url at all")).toBeNull();
  });

  it("returns null for a non-Spotify domain", () => {
    expect(
      parseSpotifyUrl("https://example.com/playlist/6rqhFgbbKwnb9MLmUQDhG6")
    ).toBeNull();
  });

  it("returns null for a malformed Spotify URL", () => {
    expect(parseSpotifyUrl("https://open.spotify.com/")).toBeNull();
  });

  it("returns null for a malformed URI", () => {
    expect(parseSpotifyUrl("spotify:playlist:")).toBeNull();
  });
});
