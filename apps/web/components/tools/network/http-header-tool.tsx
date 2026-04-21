"use client";

import * as React from "react";
import { ListMagnifyingGlass, Browser, Copy, Check, ShieldCheck, Info, LinkSimple, Bug } from "@phosphor-icons/react";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { toast } from "sonner";
import { Separator } from "@workspace/ui/components/separator";

export function HttpHeaderTool() {
  const [url, setUrl] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [data, setData] = React.useState<any>(null);
  const [copied, setCopied] = React.useState(false);

  async function handleCheck(e?: React.FormEvent) {
    e?.preventDefault();
    if (!url) {
      toast.error("Please enter a URL");
      return;
    }

    let targetUrl = url.trim();
    if (!targetUrl.startsWith("http")) {
      targetUrl = "https://" + targetUrl;
    }
    setUrl(targetUrl);

    setIsLoading(true);
    setData(null);

    try {
      const res = await fetch(`/api/network/headers?url=${encodeURIComponent(targetUrl)}`);
      const result = await res.json();

      if (!res.ok) throw new Error(result.error || "Failed to fetch headers");

      setData(result);
      toast.success("Headers retrieved successfully");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  function copyAllHeaders() {
    if (data) {
      navigator.clipboard.writeText(JSON.stringify(data.headers, null, 2));
      setCopied(true);
      toast.success("Headers copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const securityHeaders = [
    "content-security-policy",
    "strict-transport-security",
    "x-frame-options",
    "x-content-type-options",
    "referrer-policy",
    "permissions-policy",
  ];

  return (
    <div className="space-y-6">
      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListMagnifyingGlass size={24} weight="bold" className="text-primary" />
            HTTP Header Checker
          </CardTitle>
          <CardDescription>
            Inspect the response headers for any URL to check server info, security policies, and caching.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCheck} className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="url">Target URL</Label>
              <div className="relative">
                <LinkSimple size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="url"
                  className="pl-10"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            <Button type="submit" disabled={isLoading} className="h-10 px-8">
              {isLoading ? "checking..." : "Check Headers"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {data && (
        <div className="space-y-6 animate-fade-in">
          {/* Summary Card */}
          <Card className="border-primary/20 shadow-md">
            <CardHeader className="bg-primary/5 flex flex-row items-center justify-between py-4">
              <div className="flex items-center gap-4">
                <Badge variant={data.status >= 200 && data.status < 300 ? "default" : "destructive"} className="text-sm px-3 py-1">
                  {data.status} {data.statusText}
                </Badge>
                <div className="font-mono text-sm truncate max-w-[300px] hidden sm:block">
                  {url}
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={copyAllHeaders} className="gap-2">
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? "Copied" : "Copy All"}
              </Button>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Server</p>
                  <p className="font-medium">{data.headers["server"] || "N/A"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Content Type</p>
                  <p className="font-medium">{data.headers["content-type"] || "N/A"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Date</p>
                  <p className="font-medium">{data.headers["date"] || "N/A"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Security Headers */}
            <Card className="border-border/70 overflow-hidden">
              <CardHeader className="bg-muted/30 py-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <ShieldCheck size={20} className="text-primary" />
                  Security Headers
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {securityHeaders.map((header) => (
                    <div key={header} className="flex flex-col p-4 gap-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-muted-foreground">{header}</span>
                        {data.headers[header] ? (
                          <Badge variant="default" className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10 border-emerald-200">Present</Badge>
                        ) : (
                          <Badge variant="destructive" className="bg-rose-500/10 text-rose-600 hover:bg-rose-500/10 border-rose-200">Missing</Badge>
                        )}
                      </div>
                      <p className="text-xs font-mono break-all mt-1 opacity-80">
                        {data.headers[header] || "This safety header is not set. Recommended for web security."}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* All Headers */}
            <Card className="border-border/70 overflow-hidden flex flex-col">
              <CardHeader className="bg-muted/30 py-3 shrink-0">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Bug size={20} className="text-primary" />
                  Full Response Headers
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-auto max-h-[500px]">
                <div className="divide-y divide-border">
                  {Object.entries(data.headers).map(([key, value]) => (
                    <div key={key} className="p-4 flex flex-col gap-1 transition-colors hover:bg-muted/20">
                      <span className="text-[10px] font-mono font-bold text-primary uppercase">{key}</span>
                      <span className="text-xs font-mono break-all">{value as string}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
