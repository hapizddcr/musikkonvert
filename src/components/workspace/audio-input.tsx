"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Link2,
  X,
  Music,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isValidUrl, formatBytes, sanitizeFileName, sanitizeInput } from "@/lib/utils";
import { toast } from "sonner";

interface AudioInputProps {
  onAudioLoaded: (data: {
    file: File | null;
    fileName: string;
    fileSize: number;
    contentType: string;
    blobUrl: string;
    duration: number;
    arrayBuffer: ArrayBuffer;
  }) => void;
  onError: (error: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const MAX_SIZE = 50 * 1024 * 1024; // 50 MB

export function AudioInput({
  onAudioLoaded,
  onError,
  isLoading,
  setIsLoading,
}: AudioInputProps) {
  const [dragOver, setDragOver] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  const processFile = useCallback(
    async (file: File) => {
      // Validate type
      const validTypes = [
        "audio/mpeg",
        "audio/mp3",
        "audio/wav",
        "audio/wave",
        "audio/x-wav",
        "audio/ogg",
        "audio/x-m4a",
        "audio/mp4",
        "audio/aac",
      ];
      const isValidExt = /\.(mp3|wav|ogg|m4a)$/i.test(file.name);
      if (!validTypes.includes(file.type) && !isValidExt) {
        const msg = `Unsupported file type: ${file.type || "unknown"}. Use MP3, WAV, OGG, or M4A.`;
        onError(msg);
        toast.error(msg);
        return;
      }

      if (file.size > MAX_SIZE) {
        const msg = `File too large: ${formatBytes(file.size)}. Maximum is ${formatBytes(MAX_SIZE)}.`;
        onError(msg);
        toast.error(msg);
        return;
      }

      setIsLoading(true);
      try {
        const arrayBuffer = await file.arrayBuffer();
        const blobUrl = URL.createObjectURL(file);
        const duration = await getAudioDuration(blobUrl);
        onAudioLoaded({
          file,
          fileName: file.name,
          fileSize: file.size,
          contentType: file.type || "audio/mpeg",
          blobUrl,
          duration,
          arrayBuffer,
        });
        toast.success("Audio loaded — ready to process");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to read file";
        onError(msg);
        toast.error(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [onAudioLoaded, onError, setIsLoading],
  );

  const fetchFromUrl = useCallback(async () => {
    const url = sanitizeInput(urlInput);
    if (!url) {
      toast.error("Please paste an audio URL");
      return;
    }
    if (!isValidUrl(url)) {
      toast.error("Invalid URL. Use http:// or https://");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/fetch-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to fetch audio");
      }

      const { fileBase64, contentType, fileSize, fileName } = data.data as {
        fileBase64: string;
        contentType: string;
        fileSize: number;
        fileName: string;
      };

      if (fileSize > MAX_SIZE) {
        throw new Error(`Remote file too large: ${formatBytes(fileSize)}`);
      }

      // Decode base64 to ArrayBuffer
      const binary = atob(fileBase64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const arrayBuffer = bytes.buffer;

      const blob = new Blob([arrayBuffer], { type: contentType });
      const blobUrl = URL.createObjectURL(blob);
      const safeName = sanitizeFileName(fileName) || "audio.mp3";
      const file = new File([blob], safeName, { type: contentType });
      const duration = await getAudioDuration(blobUrl);

      onAudioLoaded({
        file,
        fileName: safeName,
        fileSize,
        contentType,
        blobUrl,
        duration,
        arrayBuffer,
      });
      toast.success("Audio fetched — ready to process");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to fetch audio";
      onError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [urlInput, onAudioLoaded, onError, setIsLoading]);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) void processFile(file);
    },
    [processFile],
  );

  // Cleanup blob URLs
  useEffect(() => {
    return () => {
      if (audioPreviewRef.current?.src) {
        URL.revokeObjectURL(audioPreviewRef.current.src);
      }
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary" />
          Bring your audio
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">
              <Upload className="h-4 w-4 mr-1.5" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="url">
              <Link2 className="h-4 w-4 mr-1.5" />
              From URL
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-4">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-all p-10 sm:p-14 text-center ${
                dragOver ? "drag-over" : "border-white/10 hover:border-primary/30 hover:bg-primary/5"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/mpeg,audio/mp3,audio/wav,audio/wave,audio/ogg,audio/x-m4a,audio/mp4,.mp3,.wav,.ogg,.m4a"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void processFile(file);
                }}
              />
              <div className="flex flex-col items-center gap-3">
                <div className="rounded-full bg-primary/10 p-4 ring-1 ring-primary/20">
                  {isLoading ? (
                    <Loader2 className="h-7 w-7 text-primary animate-spin" />
                  ) : (
                    <Music className="h-7 w-7 text-primary" />
                  )}
                </div>
                <div>
                  <p className="text-base font-medium">
                    {dragOver ? "Drop it like it's hot" : "Drag & drop or click to browse"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    MP3, WAV, OGG, or M4A — up to 50 MB
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <Badge variant="outline" className="text-xs">MP3</Badge>
                  <Badge variant="outline" className="text-xs">WAV</Badge>
                  <Badge variant="outline" className="text-xs">OGG</Badge>
                  <Badge variant="outline" className="text-xs">M4A</Badge>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="url" className="mt-4 space-y-3">
            <div className="space-y-2">
              <Label htmlFor="audio-url">Audio URL</Label>
              <Input
                id="audio-url"
                type="url"
                placeholder="https://example.com/audio.mp3"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void fetchFromUrl();
                }}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                We fetch the file through our server so CORS doesn't get in the way.
              </p>
            </div>
            <Button
              onClick={fetchFromUrl}
              disabled={isLoading || !urlInput}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Fetching...
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4" />
                  Fetch audio
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function getAudioDuration(blobUrl: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.preload = "metadata";
    audio.onloadedmetadata = () => {
      const d = audio.duration;
      URL.revokeObjectURL(blobUrl);
      resolve(isFinite(d) ? d : 0);
    };
    audio.onerror = () => {
      URL.revokeObjectURL(blobUrl);
      reject(new Error("Could not read audio metadata"));
    };
    audio.src = blobUrl;
  });
}
