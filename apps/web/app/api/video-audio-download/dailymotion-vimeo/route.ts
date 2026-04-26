import { NextRequest, NextResponse } from "next/server";

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "*/*",
};

interface MediaResult {
  videoUrl: string | null;
  imageUrl: string | null;
  title: string;
  type: "video" | "image";
  platform: "vimeo" | "dailymotion";
  qualities?: { label: string; url: string }[];
}

/**
 * Detect platform and extract video ID
 */
function detectPlatform(url: string): { platform: "vimeo" | "dailymotion"; videoId: string } | null {
  // Vimeo: vimeo.com/12345 or player.vimeo.com/video/12345
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) {
    return { platform: "vimeo", videoId: vimeoMatch[1]! };
  }

  // Dailymotion: dailymotion.com/video/x12345 or dai.ly/x12345
  const dmMatch = url.match(/(?:dailymotion\.com\/video\/|dai\.ly\/)([a-zA-Z0-9]+)/);
  if (dmMatch) {
    return { platform: "dailymotion", videoId: dmMatch[1]! };
  }

  return null;
}

// ─── Vimeo Handler ───────────────────────────────────────
async function handleVimeo(videoId: string): Promise<MediaResult | null> {
  try {
    // Strategy 1: Vimeo config endpoint
    const configUrl = `https://player.vimeo.com/video/${videoId}/config`;
    const configRes = await fetch(configUrl, {
      headers: {
        ...BROWSER_HEADERS,
        Referer: "https://vimeo.com/",
      },
    });

    if (configRes.ok) {
      const config = await configRes.json();
      const videoData = config?.video;
      const title = videoData?.title || "Vimeo Video";
      const thumbnail = videoData?.thumbs?.base || videoData?.thumbs?.["640"] || null;

      // Get progressive download files
      const files = config?.request?.files?.progressive;
      if (files?.length) {
        // Sort by quality (height) descending
        const sorted = [...files].sort(
          (a: any, b: any) => (b.height || 0) - (a.height || 0)
        );

        const qualities = sorted.map((f: any) => ({
          label: `${f.height}p ${f.fps ? `(${f.fps}fps)` : ""}`.trim(),
          url: f.url,
        }));

        return {
          videoUrl: sorted[0].url, // Best quality
          imageUrl: thumbnail,
          title,
          type: "video",
          platform: "vimeo",
          qualities,
        };
      }

      // Try HLS
      const hls = config?.request?.files?.hls?.cdns;
      if (hls) {
        const firstCdn = Object.values(hls)[0] as any;
        if (firstCdn?.url) {
          return {
            videoUrl: firstCdn.url,
            imageUrl: thumbnail,
            title,
            type: "video",
            platform: "vimeo",
          };
        }
      }
    }

    // Strategy 2: oEmbed for basic data
    const oembedUrl = `https://vimeo.com/api/oembed.json?url=https://vimeo.com/${videoId}`;
    const oembedRes = await fetch(oembedUrl);
    if (oembedRes.ok) {
      const oembedData = await oembedRes.json();
      return {
        videoUrl: null,
        imageUrl: oembedData.thumbnail_url || null,
        title: oembedData.title || "Vimeo Video",
        type: "image",
        platform: "vimeo",
      };
    }

    return null;
  } catch (error) {
    console.error("[Vimeo] Error:", error);
    return null;
  }
}

// ─── Dailymotion Handler ─────────────────────────────────
async function handleDailymotion(videoId: string): Promise<MediaResult | null> {
  try {
    // Dailymotion public API
    const fields = "title,thumbnail_720_url,thumbnail_480_url,stream_h264_url,stream_h264_hd_url,stream_h264_hq_url,embed_url";
    const apiUrl = `https://api.dailymotion.com/video/${videoId}?fields=${fields}`;

    const response = await fetch(apiUrl, {
      headers: BROWSER_HEADERS,
    });

    if (!response.ok) {
      console.log(`[Dailymotion] API returned ${response.status}`);
      // Fallback: scrape the page
      return await scrapeDailymotionPage(videoId);
    }

    const data = await response.json();

    const videoUrl =
      data.stream_h264_hd_url ||
      data.stream_h264_hq_url ||
      data.stream_h264_url ||
      null;

    const imageUrl = data.thumbnail_720_url || data.thumbnail_480_url || null;
    const title = data.title || "Dailymotion Video";

    if (videoUrl || imageUrl) {
      return {
        videoUrl,
        imageUrl,
        title,
        type: videoUrl ? "video" : "image",
        platform: "dailymotion",
      };
    }

    // Fallback to page scraping
    return await scrapeDailymotionPage(videoId);
  } catch (error) {
    console.error("[Dailymotion] Error:", error);
    return null;
  }
}

async function scrapeDailymotionPage(videoId: string): Promise<MediaResult | null> {
  try {
    const embedUrl = `https://www.dailymotion.com/embed/video/${videoId}`;
    const response = await fetch(embedUrl, {
      headers: BROWSER_HEADERS,
    });

    if (!response.ok) return null;

    const html = await response.text();
    let videoUrl: string | null = null;
    let imageUrl: string | null = null;
    let title = "Dailymotion Video";

    // Try to find video qualities in embedded config
    const configMatch = html.match(/"qualities":\s*(\{[^}]+(?:\{[^}]*\}[^}]*)*\})/);
    if (configMatch) {
      try {
        const qualitiesStr = configMatch[1]!;
        // Look for direct MP4 URLs
        const mp4Match = qualitiesStr.match(/"url":"(https?:[^"]+\.mp4[^"]*)"/);
        if (mp4Match) {
          videoUrl = mp4Match[1]!.replace(/\\\//g, "/");
        }
      } catch {
        // Ignore parsing errors
      }
    }

    // OG meta
    const ogVideoMatch = html.match(
      /<meta[^>]*property=["']og:video(?::url)?["'][^>]*content=["']([^"']+)["']/i
    );
    if (ogVideoMatch && !videoUrl) {
      videoUrl = ogVideoMatch[1]!.replace(/&amp;/g, "&");
    }

    const ogImageMatch = html.match(
      /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i
    );
    if (ogImageMatch) {
      imageUrl = ogImageMatch[1]!.replace(/&amp;/g, "&");
    }

    const ogTitleMatch = html.match(
      /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i
    );
    if (ogTitleMatch) title = ogTitleMatch[1]!;

    if (videoUrl || imageUrl) {
      return {
        videoUrl,
        imageUrl,
        title,
        type: videoUrl ? "video" : "image",
        platform: "dailymotion",
      };
    }

    return null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const detected = detectPlatform(url);
    if (!detected) {
      return NextResponse.json(
        { error: "Please enter a valid Vimeo or Dailymotion URL" },
        { status: 400 }
      );
    }

    console.log(`\n[${detected.platform}] Processing video: ${detected.videoId}`);

    let result: MediaResult | null = null;

    if (detected.platform === "vimeo") {
      result = await handleVimeo(detected.videoId);
    } else {
      result = await handleDailymotion(detected.videoId);
    }

    if (!result || (!result.videoUrl && !result.imageUrl)) {
      return NextResponse.json(
        {
          error: `Could not extract media from this ${detected.platform === "vimeo" ? "Vimeo" : "Dailymotion"} link. The video may be private or require authentication.`,
        },
        { status: 422 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[Dailymotion/Vimeo] Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
