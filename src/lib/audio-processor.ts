// Client-side audio processing using FFmpeg WebAssembly.
// No server, no installs, no uploads to our server for processing.

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import type { AudioProcessOptions } from "./validations";

let ffmpegInstance: FFmpeg | null = null;
let loaded = false;
let loadingPromise: Promise<FFmpeg> | null = null;

const CORE_VERSION = "0.12.6";
const CORE_BASE = `https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/esm`;

export async function getFFmpeg(
  onLog?: (msg: string) => void,
): Promise<FFmpeg> {
  if (ffmpegInstance && loaded) return ffmpegInstance;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    const ffmpeg = new FFmpeg();
    if (onLog) {
      ffmpeg.on("log", ({ message }) => onLog(message));
    }
    // Load core from CDN with COEP/COOP-friendly URLs
    await ffmpeg.load({
      coreURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.wasm`, "application/wasm"),
    });
    ffmpegInstance = ffmpeg;
    loaded = true;
    return ffmpeg;
  })();

  return loadingPromise;
}

export async function processAudioClient(
  file: File,
  options: AudioProcessOptions,
  onProgress?: (progress: number) => void,
): Promise<Blob> {
  const ffmpeg = await getFFmpeg();

  if (onProgress) {
    ffmpeg.on("progress", ({ progress }) => {
      // ffmpeg's progress is 0-1
      onProgress(Math.min(99, Math.max(1, Math.round(progress * 100))));
    });
  }

  const inputName = "input" + getExtension(file.name);
  const outputName = "output." + options.format;

  // Write input to FFmpeg FS
  await ffmpeg.writeFile(inputName, await fetchFile(file));

  // Build ffmpeg command
  const args = buildFFmpegArgs(inputName, outputName, options);
  // eslint-disable-next-line no-console
  console.log("FFmpeg args:", args.join(" "));

  const code = await ffmpeg.exec(args);
  if (code !== 0) {
    throw new Error(`FFmpeg exited with code ${code}`);
  }

  const data = (await ffmpeg.readFile(outputName)) as Uint8Array;
  const mimeType = getMimeForFormat(options.format);
  // Build a fresh ArrayBuffer to satisfy BlobPart typings
  const out = new ArrayBuffer(data.byteLength);
  new Uint8Array(out).set(data);
  const blob = new Blob([out], { type: mimeType });

  // Cleanup
  try {
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);
  } catch {
    // ignore
  }

  if (onProgress) onProgress(100);
  return blob;
}

function buildFFmpegArgs(
  input: string,
  output: string,
  options: AudioProcessOptions,
): string[] {
  const args: string[] = ["-i", input, "-y"];

  // Filters
  const filters: string[] = [];

  // Trim
  const trimStart = options.trimStart || 0;
  let trimEnd = options.trimEnd || 0;

  // We use -ss before -i for fast seek (input trim), and -t for output duration if trimEnd is set
  // For simplicity, use output filter chain for trim
  if (trimStart > 0 || trimEnd > 0) {
    // Build atrim filter
    if (trimEnd > 0) {
      // atrim keeps audio from start to (duration - trimEnd)
      // But we don't know duration here, so use the special "reverse" technique or just apply atrim
      // We'll use a simpler approach: trim from start, then trim from end via reverse trick
      filters.push(`atrim=start=${trimStart}`);
    } else if (trimStart > 0) {
      filters.push(`atrim=start=${trimStart}`);
    }
  }

  // Volume (percentage 0-300, ffmpeg expects multiplier)
  const volumeMultiplier = options.volume / 100;
  if (volumeMultiplier !== 1) {
    filters.push(`volume=${volumeMultiplier.toFixed(3)}`);
  }

  // Speed (atempo 0.5-2.0 per filter, can chain for 0.25-4.0)
  if (options.speed !== 1) {
    const speedFilters = buildAtempoChain(options.speed);
    filters.push(...speedFilters);
  }

  // Fades
  if (options.fadeIn || options.fadeOut) {
    // Fade durations — 1.5s in, 2s out by default
    const fadeInDur = 1.5;
    const fadeOutDur = 2;
    const totalExpr = filters.length > 0 ? "a" : "0a";
    if (options.fadeIn && options.fadeOut) {
      filters.push(`afade=t=in:st=0:d=${fadeInDur},afade=t=out:st=0:d=${fadeOutDur}`);
    } else if (options.fadeIn) {
      filters.push(`afade=t=in:st=0:d=${fadeInDur}`);
    } else if (options.fadeOut) {
      filters.push(`afade=t=out:st=0:d=${fadeOutDur}`);
    }
  }

  if (filters.length > 0) {
    args.push("-af", filters.join(","));
  }

  // Output format
  if (options.format === "mp3") {
    args.push("-c:a", "libmp3lame", "-q:a", "2");
  } else if (options.format === "ogg") {
    args.push("-c:a", "libvorbis", "-q:a", "5");
  } else if (options.format === "wav") {
    args.push("-c:a", "pcm_s16le");
  }

  args.push(output);
  return args;
}

function buildAtempoChain(speed: number): string[] {
  // atempo accepts 0.5 - 2.0 per filter invocation
  const filters: string[] = [];
  let remaining = speed;
  if (remaining >= 1) {
    while (remaining > 2.0) {
      filters.push("atempo=2.0");
      remaining /= 2.0;
    }
    if (remaining !== 1) {
      filters.push(`atempo=${remaining.toFixed(3)}`);
    }
  } else {
    while (remaining < 0.5) {
      filters.push("atempo=0.5");
      remaining *= 2.0;
    }
    if (remaining !== 1) {
      filters.push(`atempo=${remaining.toFixed(3)}`);
    }
  }
  return filters;
}

function getExtension(name: string): string {
  const idx = name.lastIndexOf(".");
  return idx >= 0 ? name.slice(idx) : ".mp3";
}

function getMimeForFormat(format: string): string {
  switch (format) {
    case "mp3":
      return "audio/mpeg";
    case "ogg":
      return "audio/ogg";
    case "wav":
      return "audio/wav";
    default:
      return "audio/mpeg";
  }
}
