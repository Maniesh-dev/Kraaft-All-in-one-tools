import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "Instagram API is working" });
}

// Common headers to mimic a real browser
const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "Upgrade-Insecure-Requests": "1",
};

interface MediaResult {
  videoUrl: string | null;
  imageUrl: string | null;
  title: string;
  type: "video" | "image";
}

/**
 * Extract the shortcode from various Instagram URL formats.
 * Supports: /p/CODE/, /reel/CODE/, /reels/CODE/, /tv/CODE/
 */
function extractShortcode(url: string): string | null {
  const match = url.match(
    /instagram\.com\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/
  );
  return match ? match[1]! : null;
}

/**
 * Clean escaped URLs from Instagram's JSON/HTML
 */
function cleanUrl(raw: string): string {
  return raw
    .replace(/\\u002F/gi, "/")
    .replace(/\\\//g, "/")
    .replace(/\\u0026/gi, "&")
    .replace(/&amp;/g, "&");
}

// ─────────────────────────────────────────────
// Strategy 1: GraphQL API (?__a=1&__d=dis)
// ─────────────────────────────────────────────
async function tryGraphQLApi(url: string): Promise<MediaResult | null> {
  try {
    const shortcode = extractShortcode(url);
    if (!shortcode) return null;

    // Try the ?__a=1&__d=dis endpoint on the post page
    const apiUrl = `https://www.instagram.com/p/${shortcode}/?__a=1&__d=dis`;

    const response = await fetch(apiUrl, {
      headers: {
        ...BROWSER_HEADERS,
        Accept: "*/*",
        "X-IG-App-ID": "936619743392459",
        "X-Requested-With": "XMLHttpRequest",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      console.log(`[Strategy 1] GraphQL API returned ${response.status}`);
      return null;
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("json")) {
      console.log("[Strategy 1] Response is not JSON, likely a login redirect");
      return null;
    }

    const data = await response.json();
    const media =
      data?.items?.[0] ||
      data?.graphql?.shortcode_media ||
      data?.data?.shortcode_media;

    if (!media) {
      console.log("[Strategy 1] No media data found in GraphQL response");
      return null;
    }

    // Extract video URL
    let videoUrl: string | null = null;
    if (media.video_url) {
      videoUrl = media.video_url;
    } else if (media.video_versions?.length) {
      videoUrl = media.video_versions[0].url;
    }

    // Extract image URL
    let imageUrl: string | null = null;
    if (media.display_url) {
      imageUrl = media.display_url;
    } else if (media.image_versions2?.candidates?.length) {
      imageUrl = media.image_versions2.candidates[0].url;
    } else if (media.thumbnail_src) {
      imageUrl = media.thumbnail_src;
    }

    const title =
      media.caption?.text?.substring(0, 100) ||
      media.edge_media_to_caption?.edges?.[0]?.node?.text?.substring(0, 100) ||
      "Instagram Media";

    if (videoUrl || imageUrl) {
      console.log("[Strategy 1] Success via GraphQL API");
      return {
        videoUrl,
        imageUrl,
        title,
        type: videoUrl ? "video" : "image",
      };
    }

    return null;
  } catch (error) {
    console.error("[Strategy 1] GraphQL API error:", error);
    return null;
  }
}

// ─────────────────────────────────────────────
// Strategy 2: Main page HTML scraping
// ─────────────────────────────────────────────
async function tryMainPageScrape(url: string): Promise<MediaResult | null> {
  try {
    const shortcode = extractShortcode(url);
    if (!shortcode) return null;

    const pageUrl = `https://www.instagram.com/p/${shortcode}/`;
    const response = await fetch(pageUrl, {
      headers: BROWSER_HEADERS,
      redirect: "follow",
    });

    if (!response.ok) {
      console.log(`[Strategy 2] Main page returned ${response.status}`);
      return null;
    }

    const html = await response.text();
    let videoUrl: string | null = null;
    let imageUrl: string | null = null;
    let title = "Instagram Media";

    // Try window._sharedData
    const sharedDataMatch = html.match(
      /window\._sharedData\s*=\s*({[\s\S]*?});\s*<\/script>/
    );
    if (sharedDataMatch) {
      try {
        const sharedData = JSON.parse(sharedDataMatch[1]!);
        const media =
          sharedData?.entry_data?.PostPage?.[0]?.graphql?.shortcode_media;
        if (media) {
          videoUrl = media.video_url || null;
          imageUrl = media.display_url || null;
          title =
            media.edge_media_to_caption?.edges?.[0]?.node?.text?.substring(
              0,
              100
            ) || title;

          if (videoUrl || imageUrl) {
            console.log("[Strategy 2] Success via _sharedData");
            return {
              videoUrl,
              imageUrl,
              title,
              type: videoUrl ? "video" : "image",
            };
          }
        }
      } catch (e) {
        console.log("[Strategy 2] _sharedData parse error");
      }
    }

    // Try window.__additionalDataLoaded
    const additionalDataMatch = html.match(
      /window\.__additionalDataLoaded\s*\(\s*['"][^'"]*['"]\s*,\s*({[\s\S]*?})\s*\)\s*;/
    );
    if (additionalDataMatch) {
      try {
        const additionalData = JSON.parse(additionalDataMatch[1]!);
        const media = additionalData?.graphql?.shortcode_media;
        if (media) {
          videoUrl = media.video_url || null;
          imageUrl = media.display_url || null;
          title =
            media.edge_media_to_caption?.edges?.[0]?.node?.text?.substring(
              0,
              100
            ) || title;

          if (videoUrl || imageUrl) {
            console.log("[Strategy 2] Success via __additionalDataLoaded");
            return {
              videoUrl,
              imageUrl,
              title,
              type: videoUrl ? "video" : "image",
            };
          }
        }
      } catch (e) {
        console.log("[Strategy 2] __additionalDataLoaded parse error");
      }
    }

    // Try require("PolarisQueryPreloaderCache") pattern (newer Instagram pages)
    const preloaderMatch = html.match(
      /["']PolarisQueryPreloaderCache["'][\s\S]*?xdt_api__v1__media__shortcode__web_info[\s\S]*?({[\s\S]*?})\s*\)/
    );
    if (preloaderMatch) {
      try {
        // This is complex; try to find video_url / display_url directly
        const chunk = preloaderMatch[0];
        const vidMatch = chunk.match(/"video_url":"([^"]+)"/);
        const imgMatch = chunk.match(/"display_url":"([^"]+)"/);

        if (vidMatch) videoUrl = cleanUrl(vidMatch[1]!);
        if (imgMatch) imageUrl = cleanUrl(imgMatch[1]!);

        if (videoUrl || imageUrl) {
          console.log("[Strategy 2] Success via PolarisQueryPreloaderCache");
          return {
            videoUrl,
            imageUrl,
            title,
            type: videoUrl ? "video" : "image",
          };
        }
      } catch (e) {
        console.log("[Strategy 2] Preloader parse error");
      }
    }

    // Fallback: scan the entire HTML for "video_url" and "display_url" JSON keys
    const videoUrlInHtml = html.match(/"video_url":"([^"]+)"/);
    const displayUrlInHtml = html.match(/"display_url":"([^"]+)"/);

    if (videoUrlInHtml) videoUrl = cleanUrl(videoUrlInHtml[1]!);
    if (displayUrlInHtml) imageUrl = cleanUrl(displayUrlInHtml[1]!);

    // Also try video_versions (newer API format embedded in page)
    if (!videoUrl) {
      const videoVersionsMatch = html.match(
        /"video_versions":\s*\[\s*\{[^}]*"url":"([^"]+)"/
      );
      if (videoVersionsMatch) {
        videoUrl = cleanUrl(videoVersionsMatch[1]!);
      }
    }

    if (!imageUrl) {
      const imageCandidatesMatch = html.match(
        /"image_versions2":\s*\{[^}]*"candidates":\s*\[\s*\{[^}]*"url":"([^"]+)"/
      );
      if (imageCandidatesMatch) {
        imageUrl = cleanUrl(imageCandidatesMatch[1]!);
      }
    }

    // Try OG meta tags
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
        /<meta[^>]*property=["']og:image(?::url|:secure_url)?["'][^>]*content=["']([^"']+)["']/i
      );
      if (ogImageMatch) {
        imageUrl = cleanUrl(ogImageMatch[1]!);
      }
    }

    // Get title from OG
    const ogTitleMatch = html.match(
      /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i
    );
    if (ogTitleMatch) title = ogTitleMatch[1]!;

    if (videoUrl || imageUrl) {
      console.log("[Strategy 2] Success via main page HTML patterns");
      return {
        videoUrl,
        imageUrl,
        title,
        type: videoUrl ? "video" : "image",
      };
    }

    return null;
  } catch (error) {
    console.error("[Strategy 2] Main page scrape error:", error);
    return null;
  }
}

// ─────────────────────────────────────────────
// Strategy 3: Embed page scraping (original)
// ─────────────────────────────────────────────
async function tryEmbedPage(url: string): Promise<MediaResult | null> {
  try {
    const shortcode = extractShortcode(url);
    if (!shortcode) return null;

    const embedUrl = `https://www.instagram.com/p/${shortcode}/embed/`;

    const response = await fetch(embedUrl, {
      headers: {
        ...BROWSER_HEADERS,
        Referer: "https://www.instagram.com/",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      console.log(`[Strategy 3] Embed page returned ${response.status}`);
      return null;
    }

    const html = await response.text();
    let videoUrl: string | null = null;
    let imageUrl: string | null = null;
    let title = "Instagram Media";

    // Try ld+json
    const ldJsonMatch = html.match(
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i
    );
    if (ldJsonMatch) {
      try {
        const ldData = JSON.parse(ldJsonMatch[1]!);
        const video = ldData.video || (Array.isArray(ldData) ? ldData.find((i: any) => i.video)?.video : null);
        if (video?.contentUrl) {
          videoUrl = video.contentUrl;
          imageUrl = ldData.image || video.thumbnailUrl || null;
          title = ldData.name || title;

          if (videoUrl) {
            console.log("[Strategy 3] Success via ld+json");
            return { videoUrl, imageUrl, title, type: "video" };
          }
        }
      } catch (e) {
        console.log("[Strategy 3] ld+json parse error");
      }
    }

    // Try OG meta tags on embed page
    const ogVideoMatch =
      html.match(
        /<meta[^>]*property=["']og:video(?::url|:secure_url)?["'][^>]*content=["']([^"']+)["']/i
      ) ||
      html.match(
        /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:video(?::url|:secure_url)?["']/i
      );

    const ogImageMatch =
      html.match(
        /<meta[^>]*property=["']og:image(?::url|:secure_url)?["'][^>]*content=["']([^"']+)["']/i
      ) ||
      html.match(
        /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image(?::url|:secure_url)?["']/i
      );

    if (ogVideoMatch) videoUrl = cleanUrl(ogVideoMatch[1]!);
    if (ogImageMatch) imageUrl = cleanUrl(ogImageMatch[1]!);

    // Try "video_url" in the embed page's inline scripts
    if (!videoUrl) {
      const videoUrlMatch = html.match(/"video_url":"([^"]+)"/);
      if (videoUrlMatch) {
        videoUrl = cleanUrl(videoUrlMatch[1]!);
        console.log("[Strategy 3] Found video_url in embed HTML");
      }
    }

    if (!imageUrl) {
      const displayUrlMatch = html.match(/"display_url":"([^"]+)"/);
      if (displayUrlMatch) {
        imageUrl = cleanUrl(displayUrlMatch[1]!);
      }
    }

    // Get title from embed page
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch) title = titleMatch[1]!;

    if (videoUrl || imageUrl) {
      console.log("[Strategy 3] Success via embed page");
      return {
        videoUrl,
        imageUrl,
        title,
        type: videoUrl ? "video" : "image",
      };
    }

    // Final fallback: scan for raw CDN URLs in embed page
    return extractCdnUrls(html, title);
  } catch (error) {
    console.error("[Strategy 3] Embed page error:", error);
    return null;
  }
}

// ─────────────────────────────────────────────
// Strategy 4: Raw CDN URL scanning
// ─────────────────────────────────────────────
function extractCdnUrls(html: string, title: string): MediaResult | null {
  let videoUrl: string | null = null;
  let imageUrl: string | null = null;

  // Video CDN patterns
  const videoCdnMatch =
    html.match(
      /https?:\/\/(?:[^\s"']+\.)?cdninstagram\.com\/[^\s"']+\.mp4[^\s"']*/i
    ) ||
    html.match(
      /https?:\/\/(?:[^\s"']+\.)?fbcdn\.net\/[^\s"']+\.mp4[^\s"']*/i
    ) ||
    html.match(
      /https?:\/\/scontent[^\s"']*\.cdninstagram\.com\/[^\s"']+/i
    );

  if (videoCdnMatch) {
    videoUrl = cleanUrl(videoCdnMatch[0]);
    console.log("[Strategy 4] Found video via CDN pattern");
  }

  // Image CDN patterns
  const imageCdnMatch =
    html.match(
      /https?:\/\/(?:[^\s"']+\.)?cdninstagram\.com\/[^\s"']+\.(?:jpg|jpeg|webp|png)[^\s"']*/i
    ) ||
    html.match(
      /https?:\/\/(?:[^\s"']+\.)?fbcdn\.net\/[^\s"']+\.(?:jpg|jpeg|webp|png)[^\s"']*/i
    );

  if (imageCdnMatch) {
    imageUrl = cleanUrl(imageCdnMatch[0]);
    console.log("[Strategy 4] Found image via CDN pattern");
  }

  if (videoUrl || imageUrl) {
    return {
      videoUrl,
      imageUrl,
      title,
      type: videoUrl ? "video" : "image",
    };
  }

  return null;
}

// ─────────────────────────────────────────────
// Main POST handler
// ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    if (!url.includes("instagram.com")) {
      return NextResponse.json(
        { error: "Invalid Instagram URL" },
        { status: 400 }
      );
    }

    const shortcode = extractShortcode(url);
    if (!shortcode) {
      return NextResponse.json(
        {
          error:
            "Could not identify the post. Please use a direct link to a Reel, Video, or Photo.",
        },
        { status: 400 }
      );
    }

    console.log(`\n[Instagram] Processing shortcode: ${shortcode}`);

    // Try each strategy in order
    let result: MediaResult | null = null;

    // Strategy 1: GraphQL API
    result = await tryGraphQLApi(url);
    if (result) {
      return NextResponse.json(result);
    }

    // Strategy 2: Main page scraping
    result = await tryMainPageScrape(url);
    if (result) {
      return NextResponse.json(result);
    }

    // Strategy 3: Embed page scraping
    result = await tryEmbedPage(url);
    if (result) {
      return NextResponse.json(result);
    }

    console.log("[Instagram] All strategies failed");
    return NextResponse.json(
      {
        error:
          "Could not extract media from this Instagram link. This can happen if the post is private, has been deleted, or Instagram is blocking the request. Please try again later.",
      },
      { status: 422 }
    );
  } catch (error: any) {
    console.error("[Instagram] Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
