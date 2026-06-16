"use client";

import { useState, useEffect } from "react";
import { History as HistoryIcon, Trash2, Copy, ExternalLink, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getHistory, removeHistoryEntry, clearHistory, type HistoryEntry } from "@/lib/history";
import { copyToClipboard, formatBytes, truncateAddress } from "@/lib/utils";
import { toast } from "sonner";

export function HistorySection() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  const refresh = () => {
    setEntries(getHistory());
  };

  useEffect(() => {
    refresh();
  }, []);

  const remove = (id: string) => {
    removeHistoryEntry(id);
    refresh();
    toast.success("Removed from history");
  };

  const clearAll = () => {
    if (entries.length === 0) return;
    clearHistory();
    refresh();
    toast.success("History cleared");
  };

  const copy = async (text: string) => {
    const ok = await copyToClipboard(text);
    toast[ok ? "success" : "error"](ok ? "Copied Asset ID" : "Copy failed");
  };

  return (
    <section id="history" className="py-20 sm:py-28 border-t border-white/5">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl flex items-center gap-3">
              <HistoryIcon className="h-7 w-7 text-primary" />
              Your <span className="gradient-text">history</span>
            </h2>
            <p className="mt-2 text-muted-foreground">
              The last 50 uploads. Stored locally in your browser only.
            </p>
          </div>
          {entries.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAll}>
              <Trash2 className="h-4 w-4" />
              Clear all
            </Button>
          )}
        </div>

        {entries.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
                <HistoryIcon className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">
                No uploads yet. Once you upload to Roblox, your assets show up here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {entries.map((entry) => (
                <motion.div
                  key={entry.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="h-full hover:border-primary/30 transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-sm font-medium truncate flex-1">
                          {entry.fileName}
                        </CardTitle>
                        <button
                          onClick={() => remove(entry.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors p-1 -m-1"
                          aria-label="Remove from history"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(entry.date).toLocaleString()}
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <Badge variant="outline" className="text-[10px] mb-1">Asset ID</Badge>
                        <code className="block text-xs font-mono truncate">
                          {entry.assetId}
                        </code>
                      </div>
                      {entry.sizeBytes && (
                        <p className="text-xs text-muted-foreground">
                          {formatBytes(entry.sizeBytes)}
                        </p>
                      )}
                      <div className="flex items-center gap-1.5 pt-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs flex-1"
                          onClick={() => copy(entry.assetId)}
                        >
                          <Copy className="h-3 w-3" />
                          Copy ID
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs flex-1"
                          asChild
                        >
                          <a
                            href={entry.assetUrl}
                            target="_blank"
                            rel="noreferrer noopener"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Open
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </section>
  );
}
