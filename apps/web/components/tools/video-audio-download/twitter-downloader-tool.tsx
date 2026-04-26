"use client";

import * as React from "react";
import { TwitterLogo, Download, Link, Spinner, FileVideo, FileImage, Warning, ArrowClockwise } from "@phosphor-icons/react";
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
  author?: string;
}

export function TwitterDownloaderTool() {
  const [url, setUrl] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [mediaInfo, setMediaInfo] = React.useState<MediaInfo | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const handleFetchInfo = async () => {
    if (!url) { toast.error("Please enter a Twitter/X URL"); return; }
    if (!url.match(/(?:twitter\.com|x\.com)/i)) {
      toast.error("Please enter a valid Twitter/X URL");
      return;
    }

    setLoading(true);
    setMediaInfo(null);
    setErrorMsg(null);

    try {
      const response = await fetch("/api/video-audio-download/twitter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to fetch media");
      if (!data.videoUrl && !data.imageUrl) throw new Error("No downloadable media found.");

      setMediaInfo(data);
      toast.success("Media found! Ready to download.");
    } catch (error: any) {
      setErrorMsg(error.message);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (mediaUrl: string, type: "video" | "image") => {
    const filename = `twitter-${type}-${Date.now()}`;
    const proxyUrl = `/api/video-audio-download/proxy?url=${encodeURIComponent(mediaUrl)}&filename=${filename}`;
    const link = document.createElement("a");
    link.href = proxyUrl;
    link.setAttribute("download", "");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Download started!");
  };

  return (
    <div className="space-y-6">
      <Card className="border-border/60 shadow-sm overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#1DA1F2] via-[#0D8BD9] to-[#0A66C2]" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TwitterLogo className="h-6 w-6 text-[#1DA1F2]" weight="bold" />
            Twitter / X Downloader
          </CardTitle>
          <CardDescription>
            Download videos, GIFs, and images from Twitter/X by pasting the tweet link below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="https://x.com/user/status/..."
                value={url}
                onChange={(e) => { setUrl(e.target.value); setErrorMsg(null); }}
                className="pl-10"
                onKeyDown={(e) => e.key === "Enter" && handleFetchInfo()}
              />
            </div>
            <Button onClick={handleFetchInfo} disabled={loading || !url}
              className="bg-gradient-to-r from-[#1DA1F2] to-[#0A66C2] hover:opacity-90 transition-opacity">
              {loading ? (<><Spinner className="mr-2 h-4 w-4 animate-spin" />Processing...</>) : "Get Media"}
            </Button>
          </div>

          {errorMsg && !loading && (
            <div className="mt-4 flex items-center justify-between gap-2 text-sm text-red-500 bg-red-500/10 p-3 rounded-lg border border-red-500/20 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-2"><Warning size={16} weight="bold" className="shrink-0" /><span>{errorMsg}</span></div>
              <Button variant="ghost" size="sm" onClick={handleFetchInfo} className="shrink-0 text-red-500 hover:text-red-600 hover:bg-red-500/10">
                <ArrowClockwise size={14} className="mr-1" />Retry
              </Button>
            </div>
          )}

          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg border border-border/40">
            <Warning size={14} className="text-amber-500 shrink-0" />
            <span>Works for public tweets only. Private or protected tweets are not supported.</span>
          </div>
        </CardContent>
      </Card>

      {mediaInfo && (
        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden border-border/60">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            <div className="relative aspect-video bg-black flex items-center justify-center">
              {mediaInfo.type === "video" && mediaInfo.videoUrl ? (
                <>
                  <video
                    src={`/api/video-audio-download/proxy?url=${encodeURIComponent(mediaInfo.videoUrl)}&filename=preview`}
                    className="w-full h-full object-contain" controls preload="metadata" />
                  <Badge className="absolute top-3 left-3 bg-black/60 backdrop-blur-md border-none gap-1">
                    <FileVideo size={14} /> Video
                  </Badge>
                </>
              ) : mediaInfo.imageUrl ? (
                <>
                  <img src={`/api/video-audio-download/proxy?url=${encodeURIComponent(mediaInfo.imageUrl)}&filename=preview`}
                    alt="Twitter preview" className="w-full h-full object-contain" />
                  <Badge className="absolute top-3 left-3 bg-black/60 backdrop-blur-md border-none gap-1">
                    <FileImage size={14} /> Image
                  </Badge>
                </>
              ) : null}
            </div>
            <div className="p-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg line-clamp-3">{mediaInfo.title}</h3>
                  {mediaInfo.author && <p className="text-sm text-muted-foreground mt-1">@{mediaInfo.author}</p>}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm py-2 border-b border-border/40">
                    <span className="text-muted-foreground">Type</span>
                    <span className="font-medium capitalize">{mediaInfo.type}</span>
                  </div>
                  <div className="flex justify-between text-sm py-2 border-b border-border/40">
                    <span className="text-muted-foreground">Source</span>
                    <span className="font-medium">Twitter / X</span>
                  </div>
                </div>
              </div>
              <div className="space-y-3 mt-6">
                {mediaInfo.videoUrl && (
                  <Button className="w-full h-12 text-base font-bold shadow-md shadow-primary/10"
                    onClick={() => handleDownload(mediaInfo.videoUrl!, "video")}>
                    <Download className="mr-2 h-5 w-5" /> Download MP4 Video
                  </Button>
                )}
                {mediaInfo.imageUrl && (
                  <Button variant={mediaInfo.type === "video" ? "outline" : "default"}
                    className={`w-full h-12 text-base font-bold ${mediaInfo.type === "image" ? "shadow-md shadow-primary/10" : ""}`}
                    onClick={() => handleDownload(mediaInfo.imageUrl!, "image")}>
                    <Download className="mr-2 h-5 w-5" />
                    Download {mediaInfo.type === "video" ? "Thumbnail" : "Image"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {!mediaInfo && !loading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-150">
          {[
            { icon: <FileVideo size={24} className="text-sky-500" />, title: "Videos & GIFs", desc: "Download videos and GIFs from tweets." },
            { icon: <FileImage size={24} className="text-blue-500" />, title: "High Res Photos", desc: "Get original quality images from tweets." },
            { icon: <Download size={24} className="text-indigo-500" />, title: "Instant Download", desc: "No wait times, fast proxy download." }
          ].map((f, i) => (
            <Card key={i} className="bg-muted/30 border-none shadow-none text-center p-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-background flex items-center justify-center mb-3 shadow-sm">{f.icon}</div>
              <h4 className="font-semibold text-sm">{f.title}</h4>
              <p className="text-xs text-muted-foreground mt-1">{f.desc}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
