import { z } from "zod";

export const AudioFormatSchema = z.enum(["mp3", "wav", "ogg", "m4a"]);
export type AudioFormat = z.infer<typeof AudioFormatSchema>;

export const AudioProcessOptionsSchema = z.object({
  trimStart: z.number().min(0).max(3600).default(0),
  trimEnd: z.number().min(0).max(3600).default(0),
  volume: z.number().min(0).max(300).default(100), // percentage 0-300 (0% = mute, 200% = boost)
  speed: z.number().min(0.25).max(4).default(1), // 0.25x to 4x
  format: z.enum(["mp3", "ogg", "wav"]).default("mp3"),
  normalize: z.boolean().default(false),
  fadeIn: z.boolean().default(false),
  fadeOut: z.boolean().default(false),
});
export type AudioProcessOptions = z.infer<typeof AudioProcessOptionsSchema>;

export const RobloxCredentialsSchema = z.object({
  creatorId: z
    .string()
    .min(1, "Creator ID required")
    .regex(/^\d+$/, "Creator ID must be numeric"),
  apiKey: z
    .string()
    .min(20, "API key looks too short")
    .max(200, "API key too long"),
});
export type RobloxCredentials = z.infer<typeof RobloxCredentialsSchema>;

export const ValidateRobloxRequestSchema = z.object({
  creatorId: z.string().min(1),
  apiKey: z.string().min(1),
});

export const UploadToRobloxRequestSchema = z.object({
  fileBase64: z.string().min(1),
  fileName: z.string().min(1).max(255),
  contentType: z.string().min(1).max(100),
  creatorId: z.string().min(1),
  apiKey: z.string().min(1),
});

export const ProcessAudioRequestSchema = z.object({
  fileBase64: z.string().min(1),
  fileName: z.string().min(1).max(255),
  contentType: z.string().min(1).max(100),
  options: AudioProcessOptionsSchema,
});

export const FileSizeSchema = z.number().max(50 * 1024 * 1024, "File too large (max 50MB)");

export const AllowedContentTypes = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/wave",
  "audio/x-wav",
  "audio/ogg",
  "audio/x-m4a",
  "audio/mp4",
  "audio/aac",
] as const;
