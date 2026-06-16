# 🎵 RoAudio

> **Convert, preview, download, and upload audio to Roblox in seconds.**

RoAudio is a free, fast, no-login-required web app for Roblox creators. Drop an audio file, trim / boost / convert / preview it, then either download the MP3 or push it straight to Roblox Open Cloud and get an Asset ID.

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8?logo=tailwindcss)
![FFmpeg.wasm](https://img.shields.io/badge/FFmpeg-WASM-green?logo=ffmpeg)
![License](https://img.shields.io/badge/license-MIT-brightgreen)

## ✨ Features

- **Drop, click, or paste a URL** — MP3, WAV, OGG, M4A up to 50 MB
- **Built-in audio player** with live waveform visualization (decoded via Web Audio API)
- **Trim, fade, volume, speed** controls (0%–300% volume, 0.25x–4x speed)
- **Convert to MP3 / OGG / WAV** (client-side via FFmpeg WebAssembly — your audio never leaves your browser for processing)
- **Two output modes**:
  - **Download** — get a clean MP3 ready to use
  - **Upload to Roblox** — push directly via Open Cloud, get an Asset ID + URL
- **Local-only credentials** — Creator ID + API key stored in `sessionStorage` by default, with optional 6-hour `localStorage` persistence. **Never sent to our server, never logged.**
- **API key validation** — verify your Creator ID and API key work before uploading
- **Local upload history** — last 50 uploads with copy buttons
- **No accounts, no databases, no subscriptions** — works offline once loaded
- **Dark theme, purple accent, glassmorphism, fully responsive**

## 🛠️ Tech Stack

| Layer       | Tech                                                |
|-------------|-----------------------------------------------------|
| Framework   | Next.js 15 (App Router) + React 19                  |
| Language    | TypeScript 5                                        |
| Styling     | TailwindCSS 3.4 + shadcn/ui primitives              |
| Animation   | Framer Motion                                       |
| Audio       | `@ffmpeg/ffmpeg` (WebAssembly) + Web Audio API      |
| Validation  | Zod                                                 |
| Icons       | lucide-react                                        |
| Deploy      | Vercel                                              |

## 📦 Installation

```bash
# Clone
git clone https://github.com/hapizddcr/musikkonvert.git
cd musikkonvert

# Install deps (Node 20+)
npm install

# Copy env example
cp .env.example .env
# (no required env vars for basic operation)

# Run dev server
npm run dev
# → http://localhost:3000
```

## 🚀 Development

```bash
npm run dev      # Start dev server
npm run lint     # Run ESLint
npm run build    # Production build
npm run start    # Run production build
```

## ☁️ Deployment (Vercel)

The project is configured for one-click Vercel deploys:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel          # preview
vercel --prod   # production
```

Or click the button:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/hapizddcr/musikkonvert)

### Optional Environment Variables

See [`.env.example`](./.env.example). None are required for the app to run — all are optional with sensible defaults.

| Variable                  | Default                       | Description                                 |
|---------------------------|-------------------------------|---------------------------------------------|
| `ROBLOX_API_BASE_URL`     | `https://apis.roblox.com`     | Roblox Open Cloud base URL                  |
| `NEXT_PUBLIC_MAX_FILE_SIZE` | `52428800` (50MB)            | Maximum file size in bytes                  |
| `RATE_LIMIT_PER_MINUTE`   | `30`                          | API rate limit (requests per minute per IP) |

## 🔑 Roblox API Setup

To upload to Roblox you need:

1. **A Roblox Creator ID** — find it at <https://create.roblox.com/dashboard/creators>
2. **An Open Cloud API Key** with the right scopes — create one at <https://create.roblox.com/dashboard/credentials>

   Required scopes:
   - `asset` (read/write your assets)
   - `asset-delivery` (publish assets)

3. In the workspace, switch the **Output mode** to **Upload to Roblox**, paste your Creator ID and API key, and click **Validate** to test.
4. Click **Save** — the credentials are stored locally (session-only by default; tick "Remember for 6 hours" to persist).
5. Click **Convert & upload to Roblox** — you'll get an Asset ID and URL.

> 🔒 **Your API key is never sent to our server.** The `/api/upload-to-roblox` route simply forwards it to Roblox and discards it. The `/api/validate-roblox` route does the same.

## 🏗️ Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── fetch-audio/route.ts       # SSRF-protected URL fetcher
│   │   ├── health/route.ts            # Edge health check
│   │   ├── upload-to-roblox/route.ts  # Roblox Open Cloud uploader + poller
│   │   └── validate-roblox/route.ts   # Roblox key validation
│   ├── globals.css                    # Tailwind + custom dark theme
│   ├── layout.tsx                     # Root layout with Toaster
│   ├── not-found.tsx                  # 404 page
│   └── page.tsx                       # Main landing + workspace
├── components/
│   ├── landing/                       # Navbar, Hero, Features, HowItWorks, Footer
│   ├── ui/                            # shadcn/ui primitives
│   └── workspace/                     # AudioInput, Player, Tools, Uploader, Results, History
└── lib/
    ├── api-response.ts                # Standardized API response helpers
    ├── audio-processor.ts             # Client-side FFmpeg.wasm wrapper
    ├── credentials.ts                 # sessionStorage/localStorage creds manager
    ├── history.ts                     # localStorage upload history
    ├── rate-limit.ts                  # In-memory token-bucket rate limiter
    ├── roblox.ts                      # Roblox Open Cloud client
    ├── utils.ts                       # cn, formatBytes, formatDuration, etc.
    └── validations.ts                 # Zod schemas
```

## 🔐 Security

- **Input validation** on every API route via Zod
- **File type & size limits** on the client AND server
- **SSRF protection** on `/api/fetch-audio` (blocks private IP ranges)
- **Rate limiting** on all API routes (in-memory token bucket)
- **XSS protection** — all file names sanitized
- **API keys never stored on our server** — they live in your browser only
- **CORS-friendly** — all routes return safe CORS headers
- **Strict response headers** in `vercel.json` (X-Frame-Options, X-Content-Type-Options, etc.)

## ⚡ Performance

- **Lazy-loaded FFmpeg** — only loaded when you first process audio (~30MB, cached by browser)
- **Client-side audio processing** — no upload round-trip
- **Static generation** where possible
- **Code splitting** per route (Next.js default)
- **Web Audio API** for fast waveform decoding
- **`next/font` Inter** with zero layout shift
- **Standalone output** for minimal serverless bundle

## 🧪 Error Handling

Graceful error messages for:

- ❌ Invalid URL / private host
- ❌ Unsupported file type
- ❌ File too large (> 50MB)
- ❌ Network errors / timeouts
- ❌ Roblox API failure (401, 403, 429, 5xx)
- ❌ Roblox upload timeout (polls up to 60s)
- ❌ Missing / invalid API key
- ❌ FFmpeg processing errors

## 📜 License

MIT — see [LICENSE](./LICENSE).

## 🤝 Contributing

PRs welcome. Open an issue first for big changes.

## 🙏 Credits

- Roblox Open Cloud — <https://create.roblox.com/docs/cloud/open-cloud/usage>
- FFmpeg.wasm — <https://ffmpegwasm.netlify.app/>
- shadcn/ui — <https://ui.shadcn.com/>

---

Built with 💜 for the Roblox creator community.
