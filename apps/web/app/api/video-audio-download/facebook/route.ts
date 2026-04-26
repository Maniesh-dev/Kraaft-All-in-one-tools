import { NextRequest, NextResponse } from "next/server";

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
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

    if (!url.includes("facebook.com") && !url.includes("fb.watch") && !url.includes("fb.com")) {
      return NextResponse.json(
        { error: "Please enter a valid Facebook URL" },
        { status: 400 }
      );
    }

    // Resolve fb.watch and similar short links
    let finalUrl = url;
    if (url.includes("fb.watch") || url.includes("fb.com")) {
      try {
        const redirectRes = await fetch(url, {
          headers: BROWSER_HEADERS,
          redirect: "follow",
        });
        finalUrl = redirectRes.url;
      } catch {
        // Continue with original URL
      }
    }

    // Convert to mobile URL for simpler HTML
    const mobileUrl = finalUrl
      .replace("www.facebook.com", "m.facebook.com")
      .replace("web.facebook.com", "m.facebook.com");

    console.log(`\n[Facebook] Fetching: ${mobileUrl}`);

    const response = await fetch(mobileUrl, {
      headers: BROWSER_HEADERS,
      redirect: "follow",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch Facebook page" },
        { status: response.status }
      );
    }

    const html = await response.text();
    let videoUrl: string | null = null;
    let imageUrl: string | null = null;
    let title = "Facebook Video";

    // Strategy 1: Look for sd_src and hd_src in the HTML
    const hdSrcMatch = html.match(/"hd_src":"([^"]+)"/);
    const sdSrcMatch = html.match(/"sd_src":"([^"]+)"/);

    if (hdSrcMatch) {
      videoUrl = cleanUrl(hdSrcMatch[1]!);
      console.log("[Facebook] Found HD video");
    } else if (sdSrcMatch) {
      videoUrl = cleanUrl(sdSrcMatch[1]!);
      console.log("[Facebook] Found SD video");
    }

    // Strategy 2: playable_url patterns
    if (!videoUrl) {
      const playableMatch =
        html.match(/"playable_url_quality_hd":"([^"]+)"/) ||
        html.match(/"playable_url":"([^"]+)"/);
      if (playableMatch) {
        videoUrl = cleanUrl(playableMatch[1]!);
        console.log("[Facebook] Found playable_url");
      }
    }

    // Strategy 3: OG meta tags
    if (!videoUrl) {
      const ogVideoMatch = html.match(
        /<meta[^>]*property=["']og:video(?::url|:secure_url)?["'][^>]*content=["']([^"']+)["']/i
      );
      if (ogVideoMatch) {
        videoUrl = cleanUrl(ogVideoMatch[1]!);
      }
    }

    // Image extraction
    const ogImageMatch = html.match(
      /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i
    );
    if (ogImageMatch) {
      imageUrl = cleanUrl(ogImageMatch[1]!);
    }

    // Title
    const ogTitleMatch = html.match(
      /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i
    );
    if (ogTitleMatch) {
      title = ogTitleMatch[1]!;
    } else {
      const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
      if (titleMatch) title = titleMatch[1]!;
    }

    // Strategy 4: Search for fbcdn video URLs directly
    if (!videoUrl) {
      const fbcdnVideoMatch = html.match(
        /https?:\/\/video[^\s"']*\.fbcdn\.net\/[^\s"']+\.mp4[^\s"']*/i
      );
      if (fbcdnVideoMatch) {
        videoUrl = cleanUrl(fbcdnVideoMatch[0]);
        console.log("[Facebook] Found fbcdn video URL");
      }
    }

    console.log("[Facebook] Result:", { videoUrl: !!videoUrl, imageUrl: !!imageUrl });

    if (!videoUrl && !imageUrl) {
      return NextResponse.json(
        {
          error:
            "Could not extract media from this Facebook link. Make sure the video is public and not part of a private group.",
        },
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
    console.error("[Facebook] Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
