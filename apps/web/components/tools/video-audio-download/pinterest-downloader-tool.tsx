"use client";

import * as React from "react";
import { PinterestLogo, Download, Link, Spinner, FileVideo, FileImage, Warning, ArrowClockwise } from "@phosphor-icons/react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card";
import { toast } from "sonner";
import { Badge } from "@workspace/ui/components/badge";

interface MediaInfo {
  videoUrl: string | null;
  imageUrl: string | null;
  title: string;
  type: "video" | "image";
}

export function PinterestDownloaderTool() {
  const [url, setUrl] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [mediaInfo, setMediaInfo] = React.useState<MediaInfo | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const handleFetchInfo = async () => {
    if (!url) { toast.error("Please enter a Pinterest URL"); return; }
    if (!url.includes("pinterest.com") && !url.includes("pin.it")) {
      toast.error("Please enter a valid Pinterest URL"); return;
    }
    setLoading(true); setMediaInfo(null); setErrorMsg(null);
    try {
      const res = await fetch("/api/video-audio-download/pinterest", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch media");
      setMediaInfo(data); toast.success("Media found!");
    } catch (e: any) { setErrorMsg(e.message); toast.error(e.message); }
    finally { setLoading(false); }
  };

  const handleDownload = (mediaUrl: string, type: "video" | "image") => {
    const fn = `pinterest-${type}-${Date.now()}`;
    const proxy = `/api/video-audio-download/proxy?url=${encodeURIComponent(mediaUrl)}&filename=${fn}`;
    const a = document.createElement("a"); a.href = proxy; a.setAttribute("download", "");
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    toast.success("Download started!");
  };

  return (
    <div className="space-y-6">
      <Card className="border-border/60 shadow-sm overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#E60023] via-[#BD081C] to-[#C41230]" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PinterestLogo className="h-6 w-6 text-[#E60023]" weight="bold" />Pinterest Downloader
          </CardTitle>
          <CardDescription>Download images and videos from Pinterest pins.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="https://www.pinterest.com/pin/..." value={url}
                onChange={(e) => { setUrl(e.target.value); setErrorMsg(null); }} className="pl-10"
                onKeyDown={(e) => e.key === "Enter" && handleFetchInfo()} />
            </div>
            <Button onClick={handleFetchInfo} disabled={loading || !url}
              className="bg-gradient-to-r from-[#E60023] to-[#C41230] hover:opacity-90 transition-opacity">
              {loading ? (<><Spinner className="mr-2 h-4 w-4 animate-spin" />Processing...</>) : "Get Media"}
            </Button>
          </div>
          {errorMsg && !loading && (
            <div className="mt-4 flex items-center justify-between gap-2 text-sm text-red-500 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
              <div className="flex items-center gap-2"><Warning size={16} weight="bold" className="shrink-0" /><span>{errorMsg}</span></div>
              <Button variant="ghost" size="sm" onClick={handleFetchInfo} className="shrink-0 text-red-500 hover:text-red-600 hover:bg-red-500/10">
                <ArrowClockwise size={14} className="mr-1" />Retry</Button>
            </div>
          )}
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg border border-border/40">
            <Warning size={14} className="text-amber-500 shrink-0" /><span>Works for public pins only.</span>
          </div>
        </CardContent>
      </Card>

      {mediaInfo && (
        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden border-border/60">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            <div className="relative aspect-square bg-black flex items-center justify-center">
              {mediaInfo.type === "video" && mediaInfo.videoUrl ? (
                <><video src={`/api/video-audio-download/proxy?url=${encodeURIComponent(mediaInfo.videoUrl)}&filename=preview`}
                  className="w-full h-full object-contain" controls preload="metadata" />
                <Badge className="absolute top-3 left-3 bg-black/60 backdrop-blur-md border-none gap-1"><FileVideo size={14} /> Video</Badge></>
              ) : mediaInfo.imageUrl ? (
                <><img src={`/api/video-audio-download/proxy?url=${encodeURIComponent(mediaInfo.imageUrl)}&filename=preview`}
                  alt="Pinterest preview" className="w-full h-full object-contain" />
                <Badge className="absolute top-3 left-3 bg-black/60 backdrop-blur-md border-none gap-1"><FileImage size={14} /> Image</Badge></>
              ) : null}
            </div>
            <div className="p-6 flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg line-clamp-3">{mediaInfo.title}</h3>
                <div className="flex justify-between text-sm py-2 border-b border-border/40">
                  <span className="text-muted-foreground">Type</span><span className="font-medium capitalize">{mediaInfo.type}</span>
                </div>
                <div className="flex justify-between text-sm py-2 border-b border-border/40">
                  <span className="text-muted-foreground">Source</span><span className="font-medium">Pinterest</span>
                </div>
              </div>
              <div className="space-y-3 mt-6">
                {mediaInfo.videoUrl && (
                  <Button className="w-full h-12 text-base font-bold shadow-md shadow-primary/10"
                    onClick={() => handleDownload(mediaInfo.videoUrl!, "video")}>
                    <Download className="mr-2 h-5 w-5" /> Download Video
                  </Button>)}
                {mediaInfo.imageUrl && (
                  <Button variant={mediaInfo.type === "video" ? "outline" : "default"}
                    className={`w-full h-12 text-base font-bold ${mediaInfo.type === "image" ? "shadow-md shadow-primary/10" : ""}`}
                    onClick={() => handleDownload(mediaInfo.imageUrl!, "image")}>
                    <Download className="mr-2 h-5 w-5" /> Download {mediaInfo.type === "video" ? "Thumbnail" : "HD Image"}
                  </Button>)}
              </div>
            </div>
          </div>
        </Card>
      )}

      {!mediaInfo && !loading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-150">
          {[
            { icon: <FileImage size={24} className="text-red-500" />, title: "HD Images", desc: "Download original quality pin images." },
            { icon: <FileVideo size={24} className="text-rose-500" />, title: "Video Pins", desc: "Download video pins in high quality." },
            { icon: <Download size={24} className="text-pink-500" />, title: "Fast Download", desc: "No wait times, instant download." }
          ].map((f, i) => (
            <Card key={i} className="bg-muted/30 border-none shadow-none text-center p-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-background flex items-center justify-center mb-3 shadow-sm">{f.icon}</div>
              <h4 className="font-semibold text-sm">{f.title}</h4>
              <p className="text-xs text-muted-foreground mt-1">{f.desc}</p>
            </Card>))}
        </div>
      )}
    </div>
  );
}
