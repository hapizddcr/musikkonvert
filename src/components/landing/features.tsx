"use client";

import { motion } from "framer-motion";
import {
  Upload,
  Scissors,
  Volume2,
  Gauge,
  FileAudio,
  Cloud,
  Shield,
  Zap,
  History,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: Upload,
    title: "Drop & go",
    description: "Drag-drop, paste a URL, or pick a file. MP3, WAV, OGG, M4A supported.",
  },
  {
    icon: Scissors,
    title: "Trim & fade",
    description: "Cut the silence from start and end with precision. Apply fades for smooth transitions.",
  },
  {
    icon: Volume2,
    title: "Boost or reduce",
    description: "Adjust volume from 0% to 300% in real-time with live waveform feedback.",
  },
  {
    icon: Gauge,
    title: "Speed control",
    description: "Slow down or speed up your audio. From 0.25x to 4x without re-encoding artifacts.",
  },
  {
    icon: FileAudio,
    title: "Convert to MP3",
    description: "Export as MP3 ready for Roblox. Other formats supported for download.",
  },
  {
    icon: Cloud,
    title: "Direct upload",
    description: "Push straight to Roblox Open Cloud. Get an Asset ID and URL in seconds.",
  },
  {
    icon: History,
    title: "Local history",
    description: "Track your last 50 uploads right in your browser. Copy IDs anytime.",
  },
  {
    icon: Shield,
    title: "Privacy first",
    description: "Your API key never touches our server. We only forward it to Roblox.",
  },
  {
    icon: Zap,
    title: "Lightning fast",
    description: "Built on Vercel Edge. Process and upload at the speed of light.",
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to ship <span className="gradient-text">audio</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            From import to Roblox asset in one seamless workflow.
          </p>
        </motion.div>

        <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <Card className="h-full hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5 group">
                <CardHeader>
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
