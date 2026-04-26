import { NextRequest, NextResponse } from "next/server";

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

function cleanUrl(raw: string): string {
  return raw
    .replace(/\\u002F/gi, "/")
    .replace(/\\\//g, "/")
    .replace(/\\u0026/gi, "&")
    .replace(/&amp;/g, "&");
}

/**
 * Extract TikTok video ID from URL
 */
function extractVideoId(url: string): string | null {
  const match = url.match(/\/video\/(\d+)/);
  return match ? match[1]! : null;
}

// Strategy 1: oEmbed API (for metadata + thumbnail)
async function tryOEmbed(url: string) {
  try {
    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
    const response = await fetch(oembedUrl, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) return null;

    const data = await response.json();
    return {
      title: data.title || "TikTok Video",
      thumbnail: data.thumbnail_url || null,
      author: data.author_name || "",
    };
  } catch {
    return null;
  }
}

// Strategy 2: Scrape the main page for video URL
async function tryPageScrape(url: string) {
  try {
    const response = await fetch(url, {
      headers: BROWSER_HEADERS,
      redirect: "follow",
    });

    if (!response.ok) return null;

    const html = await response.text();
    let videoUrl: string | null = null;
    let imageUrl: string | null = null;

    // Look for __UNIVERSAL_DATA_FOR_REHYDRATION__
    const universalDataMatch = html.match(
      /<script[^>]*id=["']__UNIVERSAL_DATA_FOR_REHYDRATION__["'][^>]*>([\s\S]*?)<\/script>/i
    );
    if (universalDataMatch) {
      try {
        const data = JSON.parse(universalDataMatch[1]!);
        const defaultScope = data?.__DEFAULT_SCOPE__;
        const videoDetail =
          defaultScope?.["webapp.video-detail"]?.itemInfo?.itemStruct;
        if (videoDetail) {
          videoUrl = videoDetail.video?.playAddr || videoDetail.video?.downloadAddr || null;
          imageUrl = videoDetail.video?.cover || videoDetail.video?.originCover || null;

          if (videoUrl) {
            console.log("[TikTok] Found via __UNIVERSAL_DATA_FOR_REHYDRATION__");
            return { videoUrl: cleanUrl(videoUrl), imageUrl: imageUrl ? cleanUrl(imageUrl) : null };
          }
        }
      } catch {
        console.log("[TikTok] Failed to parse universal data");
      }
    }

    // Look for SIGI_STATE
    const sigiMatch = html.match(
      /<script[^>]*id=["']SIGI_STATE["'][^>]*>([\s\S]*?)<\/script>/i
    );
    if (sigiMatch) {
      try {
        const data = JSON.parse(sigiMatch[1]!);
        const itemModule = data?.ItemModule;
        if (itemModule) {
          const firstKey = Object.keys(itemModule)[0];
          if (firstKey) {
            const item = itemModule[firstKey];
            videoUrl = item?.video?.playAddr || item?.video?.downloadAddr || null;
            imageUrl = item?.video?.cover || item?.video?.originCover || null;

            if (videoUrl) {
              console.log("[TikTok] Found via SIGI_STATE");
              return { videoUrl: cleanUrl(videoUrl), imageUrl: imageUrl ? cleanUrl(imageUrl) : null };
            }
          }
        }
      } catch {
        console.log("[TikTok] Failed to parse SIGI_STATE");
      }
    }

    // Fallback: raw video URL patterns
    const videoUrlMatch =
      html.match(/"playAddr":"([^"]+)"/) ||
      html.match(/"downloadAddr":"([^"]+)"/);
    if (videoUrlMatch) {
      videoUrl = cleanUrl(videoUrlMatch[1]!);
      console.log("[TikTok] Found via raw pattern");
    }

    const coverMatch = html.match(/"cover":"([^"]+)"/);
    if (coverMatch) {
      imageUrl = cleanUrl(coverMatch[1]!);
    }

    // OG meta tags
    if (!videoUrl) {
      const ogVideoMatch = html.match(
        /<meta[^>]*property=["']og:video(?::url|:secure_url)?["'][^>]*content=["']([^"']+)["']/i
      );
      if (ogVideoMatch) {
        videoUrl = cleanUrl(ogVideoMatch[1]!);
      }
    }

    if (!imageUrl) {
      const ogImageMatch = html.match(
        /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i
      );
      if (ogImageMatch) {
        imageUrl = cleanUrl(ogImageMatch[1]!);
      }
    }

    if (videoUrl || imageUrl) {
      return { videoUrl, imageUrl };
    }

    return null;
  } catch (error) {
    console.error("[TikTok] Page scrape error:", error);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    if (!url.includes("tiktok.com")) {
      return NextResponse.json(
        { error: "Please enter a valid TikTok URL" },
        { status: 400 }
      );
    }

    const videoId = extractVideoId(url);
    console.log(`\n[TikTok] Processing video: ${videoId || url}`);

    // Get metadata from oEmbed
    const oembedData = await tryOEmbed(url);

    // Try scraping the page
    const scrapeResult = await tryPageScrape(url);

    const videoUrl = scrapeResult?.videoUrl || null;
    const imageUrl = scrapeResult?.imageUrl || oembedData?.thumbnail || null;
    const title = oembedData?.title || "TikTok Video";
    const author = oembedData?.author || "";

    console.log("[TikTok] Result:", { videoUrl: !!videoUrl, imageUrl: !!imageUrl });

    if (!videoUrl && !imageUrl) {
      return NextResponse.json(
        {
          error:
            "Could not extract media from this TikTok link. The video may be private or TikTok may be blocking the request. Please try again.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      videoUrl,
      imageUrl,
      title,
      type: videoUrl ? "video" : "image",
      author,
    });
  } catch (error) {
    console.error("[TikTok] Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
