"use client";

import { useState, useEffect } from "react";
import { Key, Eye, EyeOff, CheckCircle2, XCircle, Loader2, ShieldCheck, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  getCredentials,
  saveCredentials,
  clearCredentials,
  type StoredCredentials,
} from "@/lib/credentials";
import { sanitizeInput } from "@/lib/utils";
import { toast } from "sonner";

interface RobloxUploaderProps {
  onCredentialsChange: (creds: StoredCredentials | null) => void;
}

type ValidationState = "idle" | "checking" | "valid" | "invalid";

export function RobloxUploader({ onCredentialsChange }: RobloxUploaderProps) {
  const [creatorId, setCreatorId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [remember, setRemember] = useState(false);
  const [validation, setValidation] = useState<ValidationState>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [stored, setStored] = useState<StoredCredentials | null>(null);

  // Load existing credentials on mount
  useEffect(() => {
    const existing = getCredentials();
    if (existing) {
      setStored(existing);
      setCreatorId(existing.creatorId);
      setApiKey(existing.apiKey);
      onCredentialsChange(existing);
    }
  }, [onCredentialsChange]);

  const save = () => {
    const cleanCreator = sanitizeInput(creatorId);
    const cleanKey = sanitizeInput(apiKey);
    if (!cleanCreator || !cleanKey) {
      toast.error("Both Creator ID and API key are required");
      return;
    }
    if (!/^\d+$/.test(cleanCreator)) {
      toast.error("Creator ID must be numeric");
      return;
    }
    saveCredentials({ creatorId: cleanCreator, apiKey: cleanKey }, remember);
    const next: StoredCredentials = {
      creatorId: cleanCreator,
      apiKey: cleanKey,
      expiresAt: remember ? Date.now() + 6 * 60 * 60 * 1000 : Number.MAX_SAFE_INTEGER,
    };
    setStored(next);
    onCredentialsChange(next);
    setValidation("idle");
    toast.success(remember ? "Saved for 6 hours" : "Saved to this session only");
  };

  const clear = () => {
    clearCredentials();
    setStored(null);
    setCreatorId("");
    setApiKey("");
    setValidation("idle");
    setErrorMsg("");
    onCredentialsChange(null);
    toast.success("Credentials cleared");
  };

  const validate = async () => {
    const cleanCreator = sanitizeInput(creatorId);
    const cleanKey = sanitizeInput(apiKey);
    if (!cleanCreator || !cleanKey) {
      toast.error("Enter your Creator ID and API key first");
      return;
    }
    setValidation("checking");
    setErrorMsg("");
    try {
      const response = await fetch("/api/validate-roblox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creatorId: cleanCreator, apiKey: cleanKey }),
      });
      const data = await response.json();
      if (data.success && data.data?.valid) {
        setValidation("valid");
        toast.success("Credentials are valid");
      } else {
        setValidation("invalid");
        setErrorMsg(data.error ?? "Validation failed");
        toast.error(data.error ?? "Invalid credentials");
      }
    } catch (err) {
      setValidation("invalid");
      const msg = err instanceof Error ? err.message : "Network error";
      setErrorMsg(msg);
      toast.error(msg);
    }
  };

  const expiresLabel = (expiresAt: number) => {
    if (expiresAt === Number.MAX_SAFE_INTEGER) return "Session only";
    const remainingMs = expiresAt - Date.now();
    if (remainingMs <= 0) return "Expired";
    const hours = Math.floor(remainingMs / (60 * 60 * 1000));
    const minutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));
    return `${hours}h ${minutes}m remaining`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5 text-primary" />
          Roblox credentials
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="creator-id">Creator ID</Label>
          <Input
            id="creator-id"
            type="text"
            inputMode="numeric"
            placeholder="e.g. 1234567890"
            value={creatorId}
            onChange={(e) => setCreatorId(e.target.value.replace(/[^0-9]/g, ""))}
            autoComplete="off"
          />
          <p className="text-xs text-muted-foreground">
            Find it at{" "}
            <a
              href="https://create.roblox.com/dashboard/creators"
              target="_blank"
              rel="noreferrer noopener"
              className="text-primary hover:underline"
            >
              create.roblox.com/dashboard/creators
            </a>
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="api-key">Open Cloud API Key</Label>
          <div className="relative">
            <Input
              id="api-key"
              type={showKey ? "text" : "password"}
              placeholder="rbx_..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              autoComplete="off"
              className="pr-10 font-mono text-xs"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-muted-foreground hover:text-foreground"
              aria-label={showKey ? "Hide key" : "Show key"}
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Get one at{" "}
            <a
              href="https://create.roblox.com/dashboard/credentials"
              target="_blank"
              rel="noreferrer noopener"
              className="text-primary hover:underline"
            >
              create.roblox.com/dashboard/credentials
            </a>{" "}
            with scopes: asset, asset-delivery.
          </p>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-white/5 bg-secondary/30 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="remember" className="text-sm cursor-pointer">
              Remember for 6 hours
            </Label>
          </div>
          <Switch
            id="remember"
            checked={remember}
            onCheckedChange={setRemember}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={validate}
            disabled={validation === "checking" || !creatorId || !apiKey}
            className="flex-1"
          >
            {validation === "checking" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" />
                Validate
              </>
            )}
          </Button>
          <Button onClick={save} className="flex-1">
            Save
          </Button>
          {stored && (
            <Button variant="ghost" onClick={clear}>
              Clear
            </Button>
          )}
        </div>

        {validation === "valid" && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
            Credentials validated — ready to upload.
          </div>
        )}

        {validation === "invalid" && errorMsg && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {stored && (
          <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-white/5 pt-3">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-3 w-3 text-emerald-400" />
              <span>Stored locally only — never sent to our server</span>
            </div>
            <Badge variant="outline" className="text-[10px]">
              {expiresLabel(stored.expiresAt)}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
