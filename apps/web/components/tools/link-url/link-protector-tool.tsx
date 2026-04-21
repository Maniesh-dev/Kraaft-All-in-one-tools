"use client";

import * as React from "react";
import Link from "next/link";
import { Copy, ShieldCheck, Check, Lock, Calendar, LinkSimple, WarningCircle, BookmarkSimple } from "@phosphor-icons/react";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Switch } from "@workspace/ui/components/switch";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const REDIRECT_PATH = encodeURIComponent("/link-url/link-protector");

type ProtectedLinkResult = {
  shortUrl: string;
  slug: string;
  expiresAt?: string;
  savedToAccount: boolean;
};

async function parseApiResponse(response: Response) {
  const raw = await response.text();
  if (!raw.trim()) {
    return null;
  }

  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {
      error: response.ok ? "Unexpected server response" : "Server returned an invalid response",
    };
  }
}

export function LinkProtectorTool() {
  const { user, authFetch } = useAuth();
  const [url, setUrl] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [expiresAt, setExpiresAt] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [result, setResult] = React.useState<ProtectedLinkResult | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [saveToAccount, setSaveToAccount] = React.useState(false);

  async function handleProtect(e: React.FormEvent) {
    e.preventDefault();
    const normalizedUrl = url.trim();

    if (!normalizedUrl) {
      toast.error("Please enter a URL to protect");
      return;
    }

    try {
      const parsed = new URL(normalizedUrl);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        toast.error("Only http:// or https:// URLs are supported");
        return;
      }
    } catch {
      toast.error("Please enter a valid URL (include http:// or https://)");
      return;
    }

    if (expiresAt && new Date(expiresAt) <= new Date()) {
      toast.error("Expiry date must be in the future");
      return;
    }

    setIsLoading(true);
    setResult(null);
    setCopied(false);

    try {
      const res = await authFetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          originalUrl: normalizedUrl,
          password: password || undefined,
          expiresAt: expiresAt || undefined,
          saveToAccount,
        }),
      });

      const data = await parseApiResponse(res);

      if (!res.ok) {
        throw new Error(
          (data && typeof data.error === "string" && data.error) ||
            (data && typeof data.message === "string" && data.message) ||
            "Failed to protect link"
        );
      }

      setResult(data as ProtectedLinkResult);
      toast.success("Protected link created!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  function copyToClipboard() {
    if (result) {
      navigator.clipboard.writeText(result.shortUrl);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck size={24} weight="bold" className="text-primary" />
            Protect your Link
          </CardTitle>
          <CardDescription>
            Add a password or expiration date to any URL.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProtect} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="url">URL to Protect</Label>
              <div className="relative">
                <LinkSimple size={18} className="absolute left-3 top-1 text-muted-foreground" style={{ top: '10px' }} />
                <Input
                  id="url"
                  className="pl-10"
                  placeholder="https://example.com/secret-document"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password">Set Password (optional)</Label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-1 text-muted-foreground" style={{ top: '10px' }} />
                  <Input
                    id="password"
                    type="password"
                    className="pl-10"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiry">Expiry Date (optional)</Label>
                <div className="relative">
                  <Calendar size={18} className="absolute left-3 top-1 text-muted-foreground" style={{ top: '10px' }} />
                  <Input
                    id="expiry"
                    type="datetime-local"
                    className="pl-10"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                  />
                </div>
              </div>
            </div>
            {user ? (
              <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="save-protected-link" className="text-sm font-medium">
                      Save to account
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Save this protected link in Your Saved Data. If this stays off, it will be deleted after 24 hours.
                    </p>
                  </div>
                  <Switch
                    id="save-protected-link"
                    checked={saveToAccount}
                    onCheckedChange={setSaveToAccount}
                  />
                </div>
              </div>
            ) : null}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "creating..." : "Generate Protected Link"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && (
        <Card className="border-success/20 bg-success/5 animate-fade-in shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Your Protected Link</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input value={result.shortUrl} readOnly className="font-medium bg-background" />
              <Button onClick={copyToClipboard} variant={copied ? "default" : "outline"} className="shrink-0">
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </Button>
            </div>
            
            <div className="flex flex-col gap-2 rounded-xl bg-background/50 p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Original URL:</span>
                <span className="font-medium truncate max-w-[200px]">{url}</span>
              </div>
              {password && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Lock size={12} /> Password Protected
                  </Badge>
                </div>
              )}
              {result.expiresAt && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Expires:</span>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Calendar size={12} /> {new Date(result.expiresAt).toLocaleString()}
                  </Badge>
                </div>
              )}
            </div>

            {!result.savedToAccount ? (
              <div className="rounded-xl border border-amber-300/60 bg-amber-50 p-4 text-sm text-amber-950">
                <div className="flex items-start gap-3">
                  <WarningCircle size={18} className="mt-0.5 shrink-0 text-amber-700" />
                  <div className="space-y-3">
                    <p className="font-medium">Guest link warning</p>
                    <p className="text-amber-900/80">
                      {user
                        ? "This protected link will be deleted automatically after 24 hours because you did not choose to save it to your account."
                        : "Protected links made without an account are deleted automatically within 24 hours."}
                      {result.expiresAt ? ` This one expires on ${new Date(result.expiresAt).toLocaleString()}.` : ""}
                    </p>
                    {user ? null : (
                      <div className="flex flex-wrap gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/login?redirect=${REDIRECT_PATH}`}>Login</Link>
                        </Button>
                        <Button asChild size="sm">
                          <Link href={`/register?redirect=${REDIRECT_PATH}`}>Create account</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
                <div className="flex items-start gap-3">
                  <BookmarkSimple size={18} className="mt-0.5 shrink-0 text-emerald-700" />
                  <div className="space-y-1">
                    <p className="font-medium">Saved to your account</p>
                    <p className="text-emerald-900/80">
                      This protected link is connected to {user?.email || "your account"} and will show up in Your Saved Data.
                    </p>
                    <Link href="/saved-data" className="font-medium underline underline-offset-4">
                      Open Your Saved Data
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
