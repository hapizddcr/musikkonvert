"use client";

import { Download, Upload, Music4 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn, formatBytes } from "@/lib/utils";

export type OutputMode = "download" | "roblox";

interface OutputModeSelectorProps {
  mode: OutputMode;
  onModeChange: (mode: OutputMode) => void;
  onProcess: () => void;
  isProcessing: boolean;
  progress: number;
  hasInput: boolean;
  processedResult: { file: Blob; fileName: string; sizeBytes: number } | null;
}

export function OutputModeSelector({
  mode,
  onModeChange,
  onProcess,
  isProcessing,
  progress,
  hasInput,
  processedResult,
}: OutputModeSelectorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music4 className="h-5 w-5 text-primary" />
          Output mode
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => onModeChange("download")}
            className={cn(
              "rounded-xl border p-4 text-left transition-all",
              mode === "download"
                ? "border-primary/50 bg-primary/10 ring-2 ring-primary/30"
                : "border-white/10 bg-secondary/30 hover:border-primary/30",
            )}
            type="button"
          >
            <div className="flex items-center gap-2 mb-2">
              <Download className={cn("h-5 w-5", mode === "download" ? "text-primary" : "text-muted-foreground")} />
              <span className="font-semibold">Download</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Process and download the converted MP3. No Roblox credentials needed.
            </p>
          </button>
          <button
            onClick={() => onModeChange("roblox")}
            className={cn(
              "rounded-xl border p-4 text-left transition-all",
              mode === "roblox"
                ? "border-primary/50 bg-primary/10 ring-2 ring-primary/30"
                : "border-white/10 bg-secondary/30 hover:border-primary/30",
            )}
            type="button"
          >
            <div className="flex items-center gap-2 mb-2">
              <Upload className={cn("h-5 w-5", mode === "roblox" ? "text-primary" : "text-muted-foreground")} />
              <span className="font-semibold">Upload to Roblox</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Push directly to Roblox Open Cloud. Returns Asset ID and URL.
            </p>
          </button>
        </div>

        <Button
          onClick={onProcess}
          disabled={!hasInput || isProcessing}
          className="w-full"
          size="lg"
        >
          {isProcessing ? (
            <>Processing... {progress}%</>
          ) : mode === "roblox" ? (
            <>
              <Upload className="h-4 w-4" />
              Convert & upload to Roblox
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Convert & download
            </>
          )}
        </Button>

        {isProcessing && (
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-xs text-muted-foreground text-center">
              {progress < 50 ? "Decoding & applying effects..." : "Encoding output..."}
            </p>
          </div>
        )}

        {processedResult && !isProcessing && (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="success">Ready</Badge>
              <span className="font-mono text-xs text-muted-foreground truncate max-w-[200px]">
                {processedResult.fileName}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {formatBytes(processedResult.sizeBytes)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
