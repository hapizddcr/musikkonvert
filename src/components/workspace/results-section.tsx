"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, Copy, ExternalLink, RefreshCw, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { copyToClipboard, truncateAddress, formatBytes } from "@/lib/utils";
import { toast } from "sonner";

export interface UploadResult {
  status: "idle" | "uploading" | "success" | "error";
  message?: string;
  assetId?: string;
  assetUrl?: string;
  fileName?: string;
  fileSize?: number;
  progress?: number;
}

interface ResultsSectionProps {
  result: UploadResult;
  onRetry?: () => void;
}

export function ResultsSection({ result, onRetry }: ResultsSectionProps) {
  const [copied, setCopied] = useState<"id" | "url" | null>(null);

  const copy = async (text: string, which: "id" | "url") => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(which);
      toast.success(`Copied ${which === "id" ? "Asset ID" : "Asset URL"} to clipboard`);
      setTimeout(() => setCopied(null), 2000);
    } else {
      toast.error("Failed to copy");
    }
  };

  if (result.status === "idle") return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.status === "uploading" && (
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
              )}
              {result.status === "success" && (
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              )}
              {result.status === "error" && (
                <XCircle className="h-5 w-5 text-destructive" />
              )}
              {result.status === "uploading" && "Uploading to Roblox..."}
              {result.status === "success" && "Upload successful"}
              {result.status === "error" && "Upload failed"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.status === "uploading" && (
              <div className="space-y-2">
                <Progress value={result.progress ?? 0} />
                <p className="text-xs text-muted-foreground text-center">
                  {result.message ?? "Processing..."}
                </p>
              </div>
            )}

            {result.status === "success" && result.assetId && result.assetUrl && (
              <div className="space-y-3">
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-medium text-emerald-300">Asset ID</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => copy(result.assetId!, "id")}
                    >
                      <Copy className="h-3 w-3" />
                      {copied === "id" ? "Copied!" : "Copy"}
                    </Button>
                  </div>
                  <code className="block text-sm font-mono break-all">
                    {result.assetId}
                  </code>
                </div>

                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-medium text-primary">Asset URL</span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => copy(result.assetUrl!, "url")}
                      >
                        <Copy className="h-3 w-3" />
                        {copied === "url" ? "Copied!" : "Copy"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        asChild
                      >
                        <a
                          href={result.assetUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Open
                        </a>
                      </Button>
                    </div>
                  </div>
                  <code className="block text-sm font-mono break-all">
                    {result.assetUrl}
                  </code>
                </div>

                {result.fileName && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>File: {result.fileName}</span>
                    {result.fileSize && <span>{formatBytes(result.fileSize)}</span>}
                  </div>
                )}

                <div className="rounded-lg border border-white/5 bg-secondary/30 p-3 text-xs space-y-1">
                  <p className="font-medium">Use in Roblox:</p>
                  <code className="block font-mono text-muted-foreground">
                    assetId = {truncateAddress(result.assetId, 8, 6)}
                  </code>
                </div>
              </div>
            )}

            {result.status === "error" && (
              <div className="space-y-3">
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  {result.message ?? "An unknown error occurred."}
                </div>
                {onRetry && (
                  <Button
                    variant="outline"
                    onClick={onRetry}
                    className="w-full"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Try again
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
