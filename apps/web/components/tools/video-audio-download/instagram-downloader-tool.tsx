"use client";

import * as React from "react";
import { InstagramLogo, Download, Link, Spinner, FileVideo, FileImage, Warning, ArrowClockwise } from "@phosphor-icons/react";
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

export function InstagramDownloaderTool() {
  const [url, setUrl] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [mediaInfo, setMediaInfo] = React.useState<MediaInfo | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const normalizeUrl = (input: string): string => {
    let cleaned = input.trim();
    // Remove query params and tracking fragments
    cleaned = cleaned.split("?")[0]!;
    // Ensure it ends without trailing slash for consistent handling
    cleaned = cleaned.replace(/\/+$/, "");
    return cleaned;
  };

  const handleFetchInfo = async () => {
    if (!url) {
      toast.error("Please enter an Instagram URL");
      return;
    }

    if (!url.includes("instagram.com")) {
      toast.error("Please enter a valid Instagram URL");
      return;
    }

    // Validate it's a post/reel/tv link
    if (!/instagram\.com\/(p|reel|reels|tv)\//.test(url)) {
      toast.error("Please paste a direct link to a Reel, Post, or Video");
      return;
    }

    setLoading(true);
    setMediaInfo(null);
    setErrorMsg(null);

    try {
      const normalizedUrl = normalizeUrl(url);

      const response = await fetch("/api/video-audio-download/instagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: normalizedUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch media info");
      }

      // Validate that we got actual media URLs
      if (!data.videoUrl && !data.imageUrl) {
        throw new Error("No downloadable media found in this post.");
      }

      setMediaInfo(data);
      toast.success("Media found! Ready to download.");
    } catch (error: any) {
      const message = error.message || "Something went wrong. Please try again.";
      setErrorMsg(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (mediaUrl: string, type: "video" | "image") => {
    try {
      const filename = `instagram-${type}-${Date.now()}`;
      const proxyUrl = `/api/video-audio-download/proxy?url=${encodeURIComponent(mediaUrl)}&filename=${filename}`;
      
      // Use fetch to check if proxy works before triggering download
      const checkResponse = await fetch(proxyUrl, { method: "HEAD" });
      
      if (!checkResponse.ok) {
        // If HEAD fails, try direct link as fallback
        toast.warning("Proxy download failed, trying direct link...");
        window.open(mediaUrl, "_blank");
        return;
      }
      
      // Create a temporary link to trigger download
      const link = document.createElement("a");
      link.href = proxyUrl;
      link.setAttribute("download", "");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Download started!");
    } catch {
      // If proxy fails completely, offer direct URL
      toast.warning("Opening media in new tab...");
      window.open(mediaUrl, "_blank");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-border/60 shadow-sm overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045]" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <InstagramLogo className="h-6 w-6 text-[#E1306C]" weight="bold" />
            Instagram Downloader
          </CardTitle>
          <CardDescription>
            Download Reels, Videos, and Photos from Instagram by pasting the link below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="https://www.instagram.com/reel/..."
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setErrorMsg(null);
                }}
                className="pl-10"
                onKeyDown={(e) => e.key === "Enter" && handleFetchInfo()}
              />
            </div>
            <Button 
              onClick={handleFetchInfo} 
              disabled={loading || !url}
              className="bg-gradient-to-r from-[#833ab4] to-[#fd1d1d] hover:opacity-90 transition-opacity"
            >
              {loading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Get Media"
              )}
            </Button>
          </div>
          
          {/* Error state with retry */}
          {errorMsg && !loading && (
            <div className="mt-4 flex items-center justify-between gap-2 text-sm text-red-500 bg-red-500/10 p-3 rounded-lg border border-red-500/20 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-2">
                <Warning size={16} weight="bold" className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleFetchInfo}
                className="shrink-0 text-red-500 hover:text-red-600 hover:bg-red-500/10"
              >
                <ArrowClockwise size={14} className="mr-1" />
                Retry
              </Button>
            </div>
          )}

          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg border border-border/40">
            <Warning size={14} className="text-amber-500 shrink-0" />
            <span>Works for public posts and reels only. Private accounts are not supported.</span>
          </div>
        </CardContent>
      </Card>

      {mediaInfo && (
        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden border-border/60">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            <div className="relative aspect-square bg-black flex items-center justify-center group">
              {mediaInfo.type === "video" ? (
                <>
                  {mediaInfo.videoUrl ? (
                    <video 
                      src={`/api/video-audio-download/proxy?url=${encodeURIComponent(mediaInfo.videoUrl)}&filename=preview`}
                      className="w-full h-full object-contain"
                      poster={mediaInfo.imageUrl ? `/api/video-audio-download/proxy?url=${encodeURIComponent(mediaInfo.imageUrl)}&filename=thumb` : undefined}
                      controls
                      preload="metadata"
                      crossOrigin="anonymous"
                      onError={(e) => {
                        // If proxied video fails to load, try direct URL
                        const target = e.target as HTMLVideoElement;
                        if (mediaInfo.videoUrl && !target.src.includes("instagram.com")) {
                          target.src = mediaInfo.videoUrl;
                        }
                      }}
                    />
                  ) : mediaInfo.imageUrl ? (
                    <img 
                      src={`/api/video-audio-download/proxy?url=${encodeURIComponent(mediaInfo.imageUrl)}&filename=thumb`}
                      alt="Instagram preview" 
                      className="w-full h-full object-contain"
                    />
                  ) : null}
                  <Badge className="absolute top-3 left-3 bg-black/60 backdrop-blur-md border-none gap-1">
                    <FileVideo size={14} /> Video
                  </Badge>
                </>
              ) : (
                <>
                  {mediaInfo.imageUrl && (
                    <img 
                      src={`/api/video-audio-download/proxy?url=${encodeURIComponent(mediaInfo.imageUrl)}&filename=preview`}
                      alt="Instagram preview" 
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        // If proxied image fails to load, try direct URL
                        const target = e.target as HTMLImageElement;
                        if (mediaInfo.imageUrl && !target.src.includes("instagram.com")) {
                          target.src = mediaInfo.imageUrl;
                        }
                      }}
                    />
                  )}
                  <Badge className="absolute top-3 left-3 bg-black/60 backdrop-blur-md border-none gap-1">
                    <FileImage size={14} /> Image
                  </Badge>
                </>
              )}
            </div>
            
            <div className="p-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg line-clamp-2">{mediaInfo.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 italic">Ready for download</p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm py-2 border-b border-border/40">
                    <span className="text-muted-foreground">Type</span>
                    <span className="font-medium capitalize">{mediaInfo.type}</span>
                  </div>
                  <div className="flex justify-between text-sm py-2 border-b border-border/40">
                    <span className="text-muted-foreground">Source</span>
                    <span className="font-medium">Instagram</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mt-6">
                {mediaInfo.videoUrl && (
                  <Button 
                    className="w-full h-12 text-base font-bold shadow-md shadow-primary/10" 
                    onClick={() => handleDownload(mediaInfo.videoUrl!, "video")}
                  >
                    <Download className="mr-2 h-5 w-5" />
                    Download MP4 Video
                  </Button>
                )}
                {mediaInfo.imageUrl && (
                  <Button 
                    variant={mediaInfo.type === "video" ? "outline" : "default"}
                    className={`w-full h-12 text-base font-bold ${mediaInfo.type === "image" ? "shadow-md shadow-primary/10" : ""}`}
                    onClick={() => handleDownload(mediaInfo.imageUrl!, "image")}
                  >
                    <Download className="mr-2 h-5 w-5" />
                    Download {mediaInfo.type === "video" ? "Thumbnail" : "High Quality Image"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Instructions/Features */}
      {!mediaInfo && !loading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-150">
          {[
            { icon: <FileVideo size={24} className="text-purple-500" />, title: "Reels & Videos", desc: "Download high quality reels and long-form videos." },
            { icon: <FileImage size={24} className="text-pink-500" />, title: "High Res Photos", desc: "Get the original quality images from posts." },
            { icon: <Download size={24} className="text-orange-500" />, title: "Instant Download", desc: "No wait times, direct download via our fast proxy." }
          ].map((feature, i) => (
            <Card key={i} className="bg-muted/30 border-none shadow-none text-center p-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-background flex items-center justify-center mb-3 shadow-sm">
                {feature.icon}
              </div>
              <h4 className="font-semibold text-sm">{feature.title}</h4>
              <p className="text-xs text-muted-foreground mt-1">{feature.desc}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
