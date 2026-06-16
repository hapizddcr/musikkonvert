"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { X, FileAudio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AudioInput } from "./audio-input";
import { AudioPlayer } from "./audio-player";
import { AudioTools } from "./audio-tools";
import { OutputModeSelector, type OutputMode } from "./output-mode-selector";
import { RobloxUploader } from "./roblox-uploader";
import { ResultsSection, type UploadResult } from "./results-section";
import { addHistoryEntry } from "@/lib/history";
import type { AudioProcessOptions } from "@/lib/validations";
import type { StoredCredentials } from "@/lib/credentials";
import { sanitizeFileName, formatBytes } from "@/lib/utils";
import { toast as sonnerToast } from "sonner";

const DEFAULT_OPTIONS: AudioProcessOptions = {
  trimStart: 0,
  trimEnd: 0,
  volume: 100,
  speed: 1,
  format: "mp3",
  normalize: false,
  fadeIn: false,
  fadeOut: false,
};

interface AudioData {
  file: File | null;
  fileName: string;
  fileSize: number;
  contentType: string;
  blobUrl: string;
  duration: number;
  arrayBuffer: ArrayBuffer;
}

export function Workspace() {
  const [audioData, setAudioData] = useState<AudioData | null>(null);
  const [options, setOptions] = useState<AudioProcessOptions>(DEFAULT_OPTIONS);
  const [mode, setMode] = useState<OutputMode>("download");
  const [credentials, setCredentials] = useState<StoredCredentials | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [processed, setProcessed] = useState<{ file: Blob; fileName: string; sizeBytes: number } | null>(null);
  const [result, setResult] = useState<UploadResult>({ status: "idle" });

  // Cleanup blob URL on unmount or change
  useEffect(() => {
    return () => {
      if (audioData?.blobUrl) {
        URL.revokeObjectURL(audioData.blobUrl);
      }
    };
  }, [audioData?.blobUrl]);

  const onAudioLoaded = useCallback((data: AudioData) => {
    // Revoke previous URL
    setAudioData((prev) => {
      if (prev?.blobUrl) URL.revokeObjectURL(prev.blobUrl);
      return data;
    });
    setProcessed(null);
    setResult({ status: "idle" });
    setError(null);
  }, []);

  const onError = useCallback((msg: string) => {
    setError(msg);
  }, []);

  const clear = () => {
    if (audioData?.blobUrl) URL.revokeObjectURL(audioData.blobUrl);
    setAudioData(null);
    setProcessed(null);
    setResult({ status: "idle" });
    setError(null);
    setOptions(DEFAULT_OPTIONS);
  };

  const process = async () => {
    if (!audioData) return;
    setIsProcessing(true);
    setProgress(0);
    setResult({ status: "idle" });
    try {
      // Animate progress while waiting
      const progressInterval = setInterval(() => {
        setProgress((p) => {
          if (p >= 85) return p;
          return Math.min(p + 3, 85);
        });
      }, 250);

      // Process audio client-side with FFmpeg WASM
      const { processAudioClient } = await import("@/lib/audio-processor");
      const inputFile = audioData.file ?? new File([audioData.arrayBuffer], audioData.fileName, { type: audioData.contentType });
      const blob = await processAudioClient(inputFile, options, (p) => setProgress(p));

      clearInterval(progressInterval);
      setProgress(95);

      // Determine final filename
      const baseName = audioData.fileName.replace(/\.[^/.]+$/, "") || "roaudio";
      const finalName = sanitizeFileName(`${baseName}.${options.format}`);
      const fileSize = blob.size;
      setProcessed({ file: blob, fileName: finalName, sizeBytes: fileSize });
      setProgress(100);

      if (mode === "download") {
        // Auto-download
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = finalName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        sonnerToast.success("Download started", { description: finalName });
      } else {
        // Upload to Roblox
        if (!credentials) {
          throw new Error("Please enter your Roblox credentials below and save them first");
        }
        await uploadToRoblox(blob, finalName, getMimeForFormat(options.format), credentials);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Processing failed";
      setError(msg);
      setResult({ status: "error", message: msg });
    } finally {
      setIsProcessing(false);
      setTimeout(() => setProgress(0), 600);
    }
  };

  function getMimeForFormat(format: string): string {
    switch (format) {
      case "mp3": return "audio/mpeg";
      case "ogg": return "audio/ogg";
      case "wav": return "audio/wav";
      default: return "audio/mpeg";
    }
  }

  const uploadToRoblox = async (
    blob: Blob,
    fileName: string,
    contentType: string,
    creds: StoredCredentials,
  ) => {
    setResult({ status: "uploading", message: "Uploading to Roblox...", progress: 30 });
    try {
      const fileBase64 = await blobToBase64(blob);
      setResult({ status: "uploading", message: "Roblox is processing...", progress: 60 });

      const response = await fetch("/api/upload-to-roblox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileBase64,
          fileName,
          contentType,
          creatorId: creds.creatorId,
          apiKey: creds.apiKey,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Upload failed");
      }

      const { assetId, assetUrl } = data.data as {
        assetId: string;
        assetUrl: string;
      };

      setResult({
        status: "success",
        assetId,
        assetUrl,
        fileName,
        fileSize: blob.size,
        progress: 100,
      });

      // Add to history
      addHistoryEntry({
        fileName,
        assetId,
        assetUrl,
        sizeBytes: blob.size,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setResult({ status: "error", message: msg });
    }
  };

  return (
    <section id="workspace" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center mb-12"
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Get to work in the <span className="gradient-text">workspace</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Drop a file, tweak the audio, then download or ship to Roblox.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column: Input + Player */}
          <div className="space-y-6">
            {!audioData ? (
              <AudioInput
                onAudioLoaded={onAudioLoaded}
                onError={onError}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
              />
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between rounded-lg border border-white/5 bg-secondary/30 px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20 flex-shrink-0">
                      <FileAudio className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{audioData.fileName}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatBytes(audioData.fileSize)}</span>
                        <span>·</span>
                        <Badge variant="outline" className="text-[10px]">
                          {audioData.contentType.split("/")[1]?.toUpperCase() ?? "AUDIO"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={clear}
                    className="flex-shrink-0"
                    aria-label="Clear audio"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <AudioPlayer
                  src={audioData.blobUrl}
                  fileName={audioData.fileName}
                  fileSize={audioData.fileSize}
                  duration={audioData.duration}
                />
              </motion.div>
            )}

            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <OutputModeSelector
              mode={mode}
              onModeChange={setMode}
              onProcess={process}
              isProcessing={isProcessing}
              progress={progress}
              hasInput={!!audioData}
              processedResult={processed}
            />
          </div>

          {/* Right column: Tools + Uploader */}
          <div className="space-y-6">
            {audioData ? (
              <AudioTools
                options={options}
                onChange={setOptions}
                duration={audioData.duration}
              />
            ) : (
              <div className="rounded-xl border border-dashed border-white/10 p-12 text-center text-muted-foreground">
                <FileAudio className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">Load an audio file to unlock processing tools</p>
              </div>
            )}

            {mode === "roblox" && (
              <RobloxUploader onCredentialsChange={setCredentials} />
            )}
          </div>
        </div>

        {/* Results */}
        {result.status !== "idle" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <ResultsSection
              result={result}
              onRetry={() => audioData && void process()}
            />
          </motion.div>
        )}
      </div>
    </section>
  );
}

// Helpers
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip data URL prefix
      const idx = result.indexOf(",");
      resolve(idx >= 0 ? result.slice(idx + 1) : result);
    };
    reader.onerror = () => reject(new Error("Failed to read blob"));
    reader.readAsDataURL(blob);
  });
}
