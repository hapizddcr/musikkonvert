"use client";

import { Scissors, Volume2, Gauge, FileAudio, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AudioProcessOptions } from "@/lib/validations";
import { formatDuration } from "@/lib/utils";

interface AudioToolsProps {
  options: AudioProcessOptions;
  onChange: (options: AudioProcessOptions) => void;
  duration: number;
}

export function AudioTools({ options, onChange, duration }: AudioToolsProps) {
  const update = <K extends keyof AudioProcessOptions>(
    key: K,
    value: AudioProcessOptions[K],
  ) => {
    onChange({ ...options, [key]: value });
  };

  const reset = () => {
    onChange({
      trimStart: 0,
      trimEnd: 0,
      volume: 100,
      speed: 1,
      format: "mp3",
      normalize: false,
      fadeIn: false,
      fadeOut: false,
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2">
          <FileAudio className="h-5 w-5 text-primary" />
          Audio tools
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={reset}
          className="text-xs"
        >
          <RotateCcw className="h-3 w-3" />
          Reset
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Trim */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Scissors className="h-4 w-4 text-primary" />
              Trim
            </Label>
            <span className="text-xs text-muted-foreground">
              Output: {formatDuration(Math.max(0, duration - options.trimStart - options.trimEnd))}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="trim-start" className="text-xs text-muted-foreground">
                Start
              </Label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  id="trim-start"
                  type="range"
                  min={0}
                  max={Math.max(0, duration)}
                  step={0.1}
                  value={options.trimStart}
                  onChange={(e) => update("trimStart", Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-xs font-mono w-12 text-right tabular-nums">
                  {formatDuration(options.trimStart)}
                </span>
              </div>
            </div>
            <div>
              <Label htmlFor="trim-end" className="text-xs text-muted-foreground">
                End
              </Label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  id="trim-end"
                  type="range"
                  min={0}
                  max={Math.max(0, duration)}
                  step={0.1}
                  value={options.trimEnd}
                  onChange={(e) => update("trimEnd", Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-xs font-mono w-12 text-right tabular-nums">
                  {formatDuration(options.trimEnd)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Volume */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-primary" />
              Volume
            </Label>
            <span className="text-xs font-mono tabular-nums">
              {options.volume}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={300}
            step={5}
            value={options.volume}
            onChange={(e) => update("volume", Number(e.target.value))}
            className="w-full"
          />
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Mute</span>
            <span>100%</span>
            <span>300%</span>
          </div>
        </div>

        {/* Speed */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-primary" />
              Speed
            </Label>
            <span className="text-xs font-mono tabular-nums">
              {options.speed.toFixed(2)}x
            </span>
          </div>
          <input
            type="range"
            min={0.25}
            max={4}
            step={0.05}
            value={options.speed}
            onChange={(e) => update("speed", Number(e.target.value))}
            className="w-full"
          />
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>0.25x</span>
            <span>1x</span>
            <span>4x</span>
          </div>
        </div>

        {/* Fades */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center justify-between rounded-lg border border-white/5 bg-secondary/30 px-3 py-2.5">
            <Label htmlFor="fade-in" className="text-sm cursor-pointer">
              Fade in
            </Label>
            <Switch
              id="fade-in"
              checked={options.fadeIn}
              onCheckedChange={(v) => update("fadeIn", v)}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-white/5 bg-secondary/30 px-3 py-2.5">
            <Label htmlFor="fade-out" className="text-sm cursor-pointer">
              Fade out
            </Label>
            <Switch
              id="fade-out"
              checked={options.fadeOut}
              onCheckedChange={(v) => update("fadeOut", v)}
            />
          </div>
        </div>

        {/* Format */}
        <div className="space-y-2">
          <Label>Output format</Label>
          <Select
            value={options.format}
            onValueChange={(v) => update("format", v as "mp3" | "ogg" | "wav")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mp3">MP3 — recommended for Roblox</SelectItem>
              <SelectItem value="ogg">OGG — smallest size</SelectItem>
              <SelectItem value="wav">WAV — lossless</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
