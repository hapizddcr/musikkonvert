"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Play, Pause, SkipBack, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBytes, formatDuration } from "@/lib/utils";

interface AudioPlayerProps {
  src: string;
  fileName: string;
  fileSize: number;
  duration: number;
  onLoaded?: (actualDuration: number) => void;
}

export function AudioPlayer({ src, fileName, fileSize, duration, onLoaded }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [actualDuration, setActualDuration] = useState(duration);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [waveform, setWaveform] = useState<number[]>([]);
  const [actualFileSize, setActualFileSize] = useState(fileSize);

  // Draw waveform from audio buffer
  useEffect(() => {
    let cancelled = false;
    const draw = async () => {
      try {
        const response = await fetch(src);
        const buf = await response.arrayBuffer();
        if (cancelled) return;
        setActualFileSize(buf.byteLength);

        // Use Web Audio API to decode
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioCtx();
        const decoded = await ctx.decodeAudioData(buf.slice(0));
        if (cancelled) return;

        const channel = decoded.getChannelData(0);
        const samples = 256;
        const blockSize = Math.floor(channel.length / samples);
        const peaks: number[] = [];
        for (let i = 0; i < samples; i++) {
          let max = 0;
          for (let j = 0; j < blockSize; j++) {
            const v = Math.abs(channel[i * blockSize + j] ?? 0);
            if (v > max) max = v;
          }
          peaks.push(max);
        }
        setWaveform(peaks);
        setActualDuration(decoded.duration);
        onLoaded?.(decoded.duration);
        await ctx.close();
      } catch {
        // Fallback: visual sine wave
        const fake: number[] = [];
        for (let i = 0; i < 256; i++) {
          fake.push(Math.abs(Math.sin(i * 0.15) * 0.5 + Math.random() * 0.3));
        }
        setWaveform(fake);
      }
    };
    void draw();
    return () => {
      cancelled = true;
    };
  }, [src, onLoaded]);

  // Draw waveform on canvas
  useEffect(() => {
    if (!canvasRef.current || waveform.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const barWidth = width / waveform.length;
    const progress = actualDuration > 0 ? currentTime / actualDuration : 0;

    ctx.clearRect(0, 0, width, height);

    waveform.forEach((peak, i) => {
      const x = i * barWidth;
      const barHeight = peak * (height * 0.85);
      const y = (height - barHeight) / 2;
      const pastProgress = i / waveform.length < progress;
      ctx.fillStyle = pastProgress
        ? "hsl(263 70% 60%)"
        : "hsl(240 6% 22%)";
      ctx.fillRect(x, y, Math.max(barWidth - 1, 1), barHeight);
    });
  }, [waveform, currentTime, actualDuration]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      void audio.play();
    } else {
      audio.pause();
    }
  }, []);

  const onTimeUpdate = () => {
    setCurrentTime(audioRef.current?.currentTime ?? 0);
  };

  const onEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || actualDuration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audio.currentTime = Math.max(0, Math.min(actualDuration, ratio * actualDuration));
    setCurrentTime(audio.currentTime);
  };

  const restart = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    setCurrentTime(0);
  };

  return (
    <div className="space-y-4">
      <audio
        ref={audioRef}
        src={src}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={onTimeUpdate}
        onEnded={onEnded}
        onLoadedMetadata={(e) => {
          const a = e.currentTarget;
          if (isFinite(a.duration) && a.duration > 0) {
            setActualDuration(a.duration);
          }
        }}
        onVolumeChange={(e) => {
          setVolume(e.currentTarget.volume);
          setMuted(e.currentTarget.muted);
        }}
      />

      <div className="flex items-center gap-2 text-sm">
        <span className="font-medium truncate max-w-[60%]">{fileName}</span>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground">{formatBytes(actualFileSize)}</span>
      </div>

      <div
        onClick={seek}
        className="relative h-24 cursor-pointer rounded-lg bg-secondary/50 overflow-hidden ring-1 ring-white/5"
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
        />
        {waveform.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
            Decoding waveform...
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={restart}
          aria-label="Restart"
          className="text-muted-foreground"
        >
          <SkipBack className="h-4 w-4" />
        </Button>
        <Button
          onClick={togglePlay}
          size="icon"
          className="h-10 w-10 rounded-full purple-glow"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4 ml-0.5" />
          )}
        </Button>
        <div className="flex-1 font-mono text-sm tabular-nums text-muted-foreground">
          {formatDuration(currentTime)} / {formatDuration(actualDuration)}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            const a = audioRef.current;
            if (!a) return;
            a.muted = !a.muted;
          }}
          aria-label={muted ? "Unmute" : "Mute"}
          className="text-muted-foreground"
        >
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </Button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => {
            const a = audioRef.current;
            if (!a) return;
            a.volume = Number(e.target.value);
          }}
          className="w-24"
          aria-label="Volume"
        />
      </div>
    </div>
  );
}
