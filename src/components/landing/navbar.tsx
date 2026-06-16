"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Music4, Menu, X, Github } from "lucide-react";
import { Button } from "@/components/ui/button";

const links = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#workspace", label: "Workspace" },
  { href: "#history", label: "History" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "border-b border-white/5 bg-background/80 backdrop-blur-xl"
          : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative">
            <div className="absolute inset-0 rounded-lg bg-primary/40 blur-md group-hover:bg-primary/60 transition" />
            <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-purple-600 shadow-lg shadow-primary/30">
              <Music4 className="h-5 w-5 text-white" />
            </div>
          </div>
          <span className="text-lg font-bold tracking-tight">
            Ro<span className="gradient-text">Audio</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-white/5"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <a
            href="https://github.com/hapizddcr/musikkonvert"
            target="_blank"
            rel="noreferrer noopener"
            className="text-muted-foreground hover:text-foreground transition-colors p-2"
            aria-label="GitHub repository"
          >
            <Github className="h-5 w-5" />
          </a>
          <Button
            asChild
            size="sm"
            className="rounded-full px-5"
          >
            <a href="#workspace">Start Converting</a>
          </Button>
        </div>

        <button
          className="md:hidden p-2 rounded-md text-muted-foreground hover:text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-white/5 bg-background/95 backdrop-blur-xl"
          >
            <div className="px-4 py-4 space-y-2">
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2 text-sm rounded-md hover:bg-white/5"
                >
                  {link.label}
                </a>
              ))}
              <Button
                asChild
                className="w-full mt-2"
              >
                <a href="#workspace" onClick={() => setMobileOpen(false)}>
                  Start Converting
                </a>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
