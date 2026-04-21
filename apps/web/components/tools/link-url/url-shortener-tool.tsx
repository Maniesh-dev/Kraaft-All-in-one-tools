"use client";

import * as React from "react";
import Link from "next/link";
import { Copy, LinkSimple, Check, MagicWand, QrCode, WarningCircle, BookmarkSimple } from "@phosphor-icons/react";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Switch } from "@workspace/ui/components/switch";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "@/hooks/useAuth";

const CUSTOM_SLUG_PATTERN = /^[a-z0-9_-]{3,64}$/;
const REDIRECT_PATH = encodeURIComponent("/link-url/url-shortener");

type ShortLinkResult = {
  shortUrl: string;
  slug: string;
  expiresAt?: string;
  savedToAccount: boolean;
};

export function UrlShortenerTool() {
  const { user, authFetch } = useAuth();
  const [url, setUrl] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [result, setResult] = React.useState<ShortLinkResult | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [shortBase, setShortBase] = React.useState("kraaft.in/s/");
  const [saveToAccount, setSaveToAccount] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setShortBase(`${window.location.host}/s/`);
    }
  }, []);

  async function handleShorten(e: React.FormEvent) {
    e.preventDefault();
    const normalizedUrl = url.trim();
    const normalizedSlug = slug.trim().toLowerCase();

    if (!normalizedUrl) {
      toast.error("Please enter a URL to shorten");
      return;
    }

    try {
      const parsed = new URL(normalizedUrl); // Validate URL
      if (!["http:", "https:"].includes(parsed.protocol)) {
        toast.error("Only http:// or https:// URLs are supported");
        return;
      }
    } catch {
      toast.error("Please enter a valid URL (include http:// or https://)");
      return;
    }

    if (normalizedSlug && !CUSTOM_SLUG_PATTERN.test(normalizedSlug)) {
      toast.error('Custom slug must be 3-64 chars and use only a-z, 0-9, "_" or "-"');
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
          slug: normalizedSlug || undefined,
          saveToAccount,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to shorten URL");
      }

      setResult(data as ShortLinkResult);
      setUrl(normalizedUrl);
      setSlug(normalizedSlug);
      toast.success("URL shortened successfully!");
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
            <LinkSimple size={24} weight="bold" className="text-primary" />
            Shorten your URL
          </CardTitle>
          <CardDescription>
            Enter a long URL to create a short, shareable link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleShorten} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url">Long URL</Label>
              <Input
                id="url"
                placeholder="https://example.com/very/long/path/to/something"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="slug">Custom Slug (optional)</Label>
                <Badge variant="outline" className="text-[10px]">Optional</Badge>
              </div>
              <div className="flex gap-2">
                <div className="flex w-full items-center gap-2">
                  <span className="shrink-0 rounded-md border border-border bg-muted/40 px-2 py-2 text-xs text-muted-foreground">
                    {shortBase}
                  </span>
                  <Input
                    id="slug"
                    className="flex-1"
                    placeholder="my-cool-link"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Use 3-64 chars: lowercase letters, numbers, "_" or "-".</p>
            </div>
            {user ? (
              <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="save-short-link" className="text-sm font-medium">
                      Save to account
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Turn this on if you want the link to appear in Your Saved Data. If it stays off, the link will delete after 24 hours.
                    </p>
                  </div>
                  <Switch
                    id="save-short-link"
                    checked={saveToAccount}
                    onCheckedChange={setSaveToAccount}
                  />
                </div>
              </div>
            ) : null}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                "Shortening..."
              ) : (
                <>
                  <MagicWand size={18} className="mr-2" />
                  Shorten URL
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && (
        <Card className="animate-fade-in border-primary/20 bg-primary/5 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Your Short Link</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-2">
              <Input value={result.shortUrl} readOnly className="font-medium bg-background" />
              <Button onClick={copyToClipboard} variant={copied ? "default" : "outline"} className="shrink-0">
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </Button>
            </div>

            <div className="flex flex-col items-center gap-4 pt-4 border-t border-primary/10">
              <div className="rounded-xl bg-white p-4 shadow-sm">
                <QRCodeSVG value={result.shortUrl} size={150} />
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <QrCode size={18} />
                Scan to open on mobile
              </p>
            </div>

            {!result.savedToAccount ? (
              <div className="rounded-xl border border-amber-300/60 bg-amber-50 p-4 text-sm text-amber-950">
                <div className="flex items-start gap-3">
                  <WarningCircle size={18} className="mt-0.5 shrink-0 text-amber-700" />
                  <div className="space-y-3">
                    <p className="font-medium">Guest link warning</p>
                    <p className="text-amber-900/80">
                      {user
                        ? "This link will be deleted automatically after 24 hours because you did not choose to save it to your account."
                        : "This link will be deleted automatically after 24 hours because you are not signed in."}
                      {result.expiresAt ? ` It is scheduled to expire on ${new Date(result.expiresAt).toLocaleString()}.` : ""}
                    </p>
                    {user ? null : (
                      <div className="flex flex-wrap gap-2">
                        <Button asChild size="sm" className="bg-amber-700 text-white hover:text-amber-900 transition-all duration-300 ease-in-out">
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
                      This link is connected to {user?.email || "your account"} and will appear in Your Saved Data.
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
