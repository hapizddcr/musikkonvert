"use client";

import { motion } from "framer-motion";
import { Upload, Sliders, Send, CheckCircle2 } from "lucide-react";

const steps = [
  {
    icon: Upload,
    title: "1. Upload or paste URL",
    description: "Drop a file, pick from your device, or paste a remote audio URL.",
  },
  {
    icon: Sliders,
    title: "2. Edit & preview",
    description: "Trim, adjust volume, change speed, and listen in real-time.",
  },
  {
    icon: Send,
    title: "3. Download or upload",
    description: "Save as MP3, or send straight to Roblox with one click.",
  },
  {
    icon: CheckCircle2,
    title: "4. Get your Asset ID",
    description: "Copy the Asset ID and URL, ready to use in your game.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 sm:py-28 bg-gradient-to-b from-transparent via-primary/5 to-transparent">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ship in <span className="gradient-text">four steps</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            From your local file to a live Roblox asset — no friction.
          </p>
        </motion.div>

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 relative">
          {/* Connecting line on desktop */}
          <div className="hidden lg:block absolute top-12 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="relative"
            >
              <div className="relative flex flex-col items-center text-center">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-primary/30 blur-xl" />
                  <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-purple-500/10 ring-1 ring-primary/30 backdrop-blur-sm">
                    <step.icon className="h-9 w-9 text-primary" />
                  </div>
                </div>
                <h3 className="mt-6 text-base font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground max-w-xs">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
