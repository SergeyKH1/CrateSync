# CrateSync

Sync your Spotify playlists to Bandcamp wishlists. CrateSync searches Bandcamp for each track in a Spotify playlist, shows match confidence, and lets you add results to your Bandcamp wishlist or cart via a companion Chrome extension.

## Features

- Paste a Spotify playlist URL and fetch all tracks
- Fuzzy-match each track against Bandcamp search results (exact, close, not found)
- One-click add to Bandcamp wishlist or cart via Chrome extension
- Alternative search links for Beatport, Juno, and Traxsource when no Bandcamp match is found
- Export sync results to CSV
- Works without Spotify API credentials using built-in mock data

## Quick Start

```bash
git clone <repo-url> CrateSync
cd CrateSync
npm install
cp .env.example .env.local   # optional: add Spotify credentials
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the values if you want live Spotify data. When the variables are not set, the app uses mock playlist data.

| Variable              | Description                        |
| --------------------- | ---------------------------------- |
| SPOTIFY_CLIENT_ID     | Spotify app client ID (optional)   |
| SPOTIFY_CLIENT_SECRET | Spotify app client secret (optional) |

## Chrome Extension Setup

The companion extension adds tracks to your Bandcamp wishlist directly from the CrateSync UI.

1. Open `chrome://extensions/` in Chrome
2. Enable **Developer mode**
3. Click **Load unpacked** and select the `extension/` directory
4. Navigate to a Bandcamp page to activate the extension

## Available Scripts

| Command           | Description                        |
| ----------------- | ---------------------------------- |
| `npm run dev`     | Start the Next.js dev server       |
| `npm run build`   | Production build                   |
| `npm start`       | Start the production server        |
| `npm run lint`    | Run ESLint                         |
| `npm test`        | Run Jest tests                     |
| `npm run test:watch` | Run tests in watch mode         |
| `npm run test:ci` | Run tests with coverage (CI mode)  |

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Search:** Fuse.js (fuzzy matching)
- **Testing:** Jest, Testing Library
- **CI:** GitHub Actions

## Project Structure

```
src/
  app/          # Next.js App Router pages and layouts
  components/   # React components
  hooks/        # Custom React hooks
  lib/          # Utility modules (Spotify, Bandcamp, matching, CSV)
extension/      # Chrome extension (manifest v3)
```

## Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes
4. Open a pull request

## License

MIT
