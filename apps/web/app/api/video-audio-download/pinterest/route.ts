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

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    if (!url.includes("pinterest.com") && !url.includes("pin.it")) {
      return NextResponse.json(
        { error: "Please enter a valid Pinterest URL" },
        { status: 400 }
      );
    }

    // Resolve short links
    let finalUrl = url;
    if (url.includes("pin.it")) {
      try {
        const redirectRes = await fetch(url, {
          headers: BROWSER_HEADERS,
          redirect: "follow",
        });
        finalUrl = redirectRes.url;
      } catch {
        return NextResponse.json(
          { error: "Could not resolve Pinterest short link" },
          { status: 400 }
        );
      }
    }

    console.log(`\n[Pinterest] Fetching: ${finalUrl}`);

    const response = await fetch(finalUrl, {
      headers: BROWSER_HEADERS,
      redirect: "follow",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch Pinterest page" },
        { status: response.status }
      );
    }

    const html = await response.text();
    let videoUrl: string | null = null;
    let imageUrl: string | null = null;
    let title = "Pinterest Media";

    // Try OG meta tags first (most reliable for Pinterest)
    const ogVideoMatch = html.match(
      /<meta[^>]*property=["']og:video(?::url|:secure_url)?["'][^>]*content=["']([^"']+)["']/i
    );
    const ogImageMatch = html.match(
      /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i
    );
    const ogTitleMatch = html.match(
      /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i
    );

    if (ogVideoMatch) videoUrl = cleanUrl(ogVideoMatch[1]!);
    if (ogImageMatch) imageUrl = cleanUrl(ogImageMatch[1]!);
    if (ogTitleMatch) title = ogTitleMatch[1]!;

    // Try to find higher res in page data
    if (!imageUrl || !videoUrl) {
      // Pinterest embeds pin data as JSON in the page
      const pinDataMatch = html.match(
        /"pin":\s*\{[^}]*"images":\s*\{[^}]*"orig":\s*\{[^}]*"url":\s*"([^"]+)"/
      );
      if (pinDataMatch && !imageUrl) {
        imageUrl = cleanUrl(pinDataMatch[1]!);
      }

      // Video in pin data
      const videoDataMatch = html.match(
        /"videos":\s*\{[^}]*"video_list":\s*\{[^}]*"V_720P":\s*\{[^}]*"url":\s*"([^"]+)"/
      );
      if (videoDataMatch && !videoUrl) {
        videoUrl = cleanUrl(videoDataMatch[1]!);
      }

      // Also try lower quality video
      if (!videoUrl) {
        const videoFallbackMatch = html.match(
          /"videos":\s*\{[^}]*"video_list":\s*\{[^}]*"V_HLSV4":\s*\{[^}]*"url":\s*"([^"]+)"/
        );
        if (videoFallbackMatch) {
          videoUrl = cleanUrl(videoFallbackMatch[1]!);
        }
      }
    }

    // Try to get the original/highest quality image
    if (imageUrl) {
      // Pinterest image URLs have size variants like /236x/ /474x/ /originals/
      imageUrl = imageUrl
        .replace(/\/236x\//, "/originals/")
        .replace(/\/474x\//, "/originals/")
        .replace(/\/564x\//, "/originals/")
        .replace(/\/736x\//, "/originals/");
    }

    console.log("[Pinterest] Result:", { videoUrl: !!videoUrl, imageUrl: !!imageUrl });

    if (!videoUrl && !imageUrl) {
      return NextResponse.json(
        { error: "No downloadable media found. Make sure it's a public Pinterest pin." },
        { status: 422 }
      );
    }

    return NextResponse.json({
      videoUrl,
      imageUrl,
      title,
      type: videoUrl ? "video" : "image",
    });
  } catch (error) {
    console.error("[Pinterest] Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
