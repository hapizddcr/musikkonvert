"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Upload, Music2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-20 pb-24 sm:pt-28 sm:pb-32">
      {/* Floating decorative blobs */}
      <div className="pointer-events-none absolute -top-20 left-1/4 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute top-40 right-1/4 h-72 w-72 rounded-full bg-purple-500/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary backdrop-blur-sm"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Powered by Roblox Open Cloud
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl"
          >
            Convert & upload audio to{" "}
            <span className="gradient-text">Roblox</span> in seconds.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            Trim, boost, convert, and publish your audio assets directly to Roblox.
            No accounts, no installs, no nonsense.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button asChild size="xl" className="rounded-full group">
              <a href="#workspace">
                Start Converting
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
            </Button>
            <Button asChild size="xl" variant="glass" className="rounded-full">
              <a href="#how-it-works">
                <Music2 className="h-4 w-4" />
                How it works
              </a>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground"
          >
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              MP3, WAV, OGG, M4A
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              No login required
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Free forever
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Instant Asset ID
            </span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
