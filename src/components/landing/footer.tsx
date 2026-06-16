"use client";

import { Github, Heart, Music4 } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-white/5 py-12 mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-purple-600">
              <Music4 className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-semibold">
              Ro<span className="gradient-text">Audio</span>
            </span>
            <span className="text-xs text-muted-foreground ml-2">
              © {new Date().getFullYear()}
            </span>
          </div>

          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a>
            <a
              href="https://create.roblox.com/docs/cloud/open-cloud/usage"
              target="_blank"
              rel="noreferrer noopener"
              className="hover:text-foreground transition-colors"
            >
              Roblox API
            </a>
          </div>

          <a
            href="https://github.com/hapizddcr/musikkonvert"
            target="_blank"
            rel="noreferrer noopener"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Github className="h-4 w-4" />
            <span>Open source</span>
          </a>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground/60 flex items-center justify-center gap-1.5">
          Built with <Heart className="h-3 w-3 text-red-400 fill-red-400" /> for the Roblox community
        </p>
      </div>
    </footer>
  );
}
