"use client";

import * as React from "react";
import { MagnifyingGlass, Globe, Copy, Check, Info, Calendar, Shield } from "@phosphor-icons/react";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { toast } from "sonner";

export function WhoisLookupTool() {
  const [domain, setDomain] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [whoisData, setWhoisData] = React.useState<any>(null);
  const [copied, setCopied] = React.useState(false);

  async function handleLookup(e?: React.FormEvent) {
    e?.preventDefault();
    if (!domain) {
      toast.error("Please enter a domain name");
      return;
    }

    const cleanDomain = domain.trim().replace(/^https?:\/\//, "").split("/")[0] || "";
    setDomain(cleanDomain);

    setIsLoading(true);
    setWhoisData(null);

    try {
      const res = await fetch(`/api/network/whois?domain=${encodeURIComponent(cleanDomain)}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to fetch WHOIS data");

      setWhoisData(data);
      toast.success("WHOIS data retrieved");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  function copyRawData() {
    if (whoisData) {
      navigator.clipboard.writeText(JSON.stringify(whoisData, null, 2));
      setCopied(true);
      toast.success("JSON data copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe size={24} weight="bold" className="text-primary" />
            WHOIS Domain Lookup
          </CardTitle>
          <CardDescription>
            Find registration data, ownership, and server information for any domain.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLookup} className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="domain">Domain Name</Label>
              <div className="relative">
                <Globe size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="domain"
                  className="pl-10"
                  placeholder="example.com"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            <Button type="submit" disabled={isLoading} className="h-10 px-8">
              {isLoading ? "Searching..." : "Lookup"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {whoisData && (
        <div className="grid gap-6 animate-fade-in sm:grid-cols-2 lg:grid-cols-3">
          {/* Main Info */}
          <Card className="col-span-full border-primary/20 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-primary/10 mb-4 bg-primary/5">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-primary">{whoisData.domainName || domain}</span>
                <Badge variant={whoisData.domainName ? "default" : "outline"}>
                  {whoisData.domainName ? "Registered" : "Unknown"}
                </Badge>
              </div>
              <Button variant="ghost" size="sm" onClick={copyRawData} className="gap-2">
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? "Copied JSON" : "Copy JSON"}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Info size={16} /> Registrar
                  </div>
                  <p className="font-semibold">{whoisData.registrar || "N/A"}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Calendar size={16} /> Creation Date
                  </div>
                  <p className="font-semibold">{formatDate(whoisData.creationDate)}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Calendar size={16} /> Expiry Date
                  </div>
                  <p className="font-semibold">{formatDate(whoisData.registrarRegistrationExpirationDate || whoisData.expirationDate)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Name Servers */}
          <Card className="border-border/70">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Globe size={18} className="text-primary" /> Name Servers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm">
                {(Array.isArray(whoisData.nameServer) ? whoisData.nameServer : [whoisData.nameServer]).filter(Boolean).map((ns: any, i: number) => (
                  <li key={i} className="font-mono bg-muted/40 px-2 py-1 rounded truncate">{String(ns).toLowerCase()}</li>
                ))}
                {(!whoisData.nameServer) && <li className="text-muted-foreground italic">No servers found</li>}
              </ul>
            </CardContent>
          </Card>

          {/* Status */}
          <Card className="border-border/70">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Shield size={18} className="text-primary" /> Domain Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(Array.isArray(whoisData.domainStatus) ? whoisData.domainStatus : [whoisData.domainStatus]).filter(Boolean).map((status: string, i: number) => (
                  <Badge key={i} variant="outline" className="text-[10px] truncate max-w-full">
                    {typeof status === 'string' ? status.split(" ")[0] : "N/A"}
                  </Badge>
                ))}
                {(!whoisData.domainStatus) && <span className="text-sm text-muted-foreground italic">N/A</span>}
              </div>
            </CardContent>
          </Card>

          {/* Raw Data (Scrollable) */}
          <Card className="border-border/70 col-span-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold">Raw WHOIS Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-[300px] overflow-auto rounded-lg bg-black/5 dark:bg-white/5 p-4 font-mono text-[11px] leading-relaxed">
                <pre>{JSON.stringify(whoisData, null, 2)}</pre>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
