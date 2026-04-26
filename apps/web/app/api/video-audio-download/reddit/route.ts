import { NextRequest, NextResponse } from "next/server";

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "application/json",
};

/**
 * Normalize Reddit URL to the canonical format and extract the JSON endpoint
 */
function getRedditJsonUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    // Handle various Reddit URL formats
    if (
      !parsed.hostname.includes("reddit.com") &&
      !parsed.hostname.includes("redd.it")
    ) {
      return null;
    }

    // For redd.it short links, we need to follow redirect
    if (parsed.hostname.includes("redd.it")) {
      return url; // Will handle redirect in fetch
    }

    // Remove query params and trailing slash, append .json
    let path = parsed.pathname.replace(/\/+$/, "");
    return `https://www.reddit.com${path}.json`;
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

    if (
      !url.includes("reddit.com") &&
      !url.includes("redd.it")
    ) {
      return NextResponse.json(
        { error: "Please enter a valid Reddit URL" },
        { status: 400 }
      );
    }

    // Handle redd.it short links — follow redirect first
    let finalUrl = url;
    if (url.includes("redd.it")) {
      try {
        const redirectRes = await fetch(url, {
          headers: BROWSER_HEADERS,
          redirect: "follow",
        });
        finalUrl = redirectRes.url;
      } catch {
        return NextResponse.json(
          { error: "Could not resolve Reddit short link" },
          { status: 400 }
        );
      }
    }

    const jsonUrl = getRedditJsonUrl(finalUrl);
    if (!jsonUrl) {
      return NextResponse.json(
        { error: "Could not parse Reddit URL. Please use a direct post link." },
        { status: 400 }
      );
    }

    console.log(`\n[Reddit] Fetching: ${jsonUrl}`);

    const response = await fetch(jsonUrl, {
      headers: BROWSER_HEADERS,
      redirect: "follow",
    });

    if (!response.ok) {
      console.log(`[Reddit] API returned ${response.status}`);
      return NextResponse.json(
        { error: "Failed to fetch Reddit post data" },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Reddit .json returns an array of listings
    const post = data?.[0]?.data?.children?.[0]?.data;
    if (!post) {
      return NextResponse.json(
        { error: "Could not find post data. Make sure it's a valid Reddit post URL." },
        { status: 422 }
      );
    }

    let videoUrl: string | null = null;
    let imageUrl: string | null = null;
    let audioUrl: string | null = null;
    const title = post.title || "Reddit Media";

    // Check for Reddit-hosted video
    if (post.secure_media?.reddit_video) {
      const rv = post.secure_media.reddit_video;
      videoUrl = rv.fallback_url || rv.hls_url || null;
      // Reddit separates audio — audio is at DASH_AUDIO_128.mp4
      if (videoUrl) {
        const baseUrl = videoUrl.split("DASH_")[0];
        audioUrl = `${baseUrl}DASH_AUDIO_128.mp4`;
      }
    } else if (post.media?.reddit_video) {
      const rv = post.media.reddit_video;
      videoUrl = rv.fallback_url || rv.hls_url || null;
      if (videoUrl) {
        const baseUrl = videoUrl.split("DASH_")[0];
        audioUrl = `${baseUrl}DASH_AUDIO_128.mp4`;
      }
    }

    // Check for image/gallery
    if (!videoUrl) {
      if (post.url_overridden_by_dest) {
        const mediaUrl = post.url_overridden_by_dest;
        if (/\.(jpg|jpeg|png|gif|webp)/i.test(mediaUrl)) {
          imageUrl = mediaUrl;
        } else if (/\.(mp4|webm)/i.test(mediaUrl)) {
          videoUrl = mediaUrl;
        }
      }

      // Reddit image posts
      if (!imageUrl && post.preview?.images?.length) {
        imageUrl = post.preview.images[0].source?.url?.replace(/&amp;/g, "&") || null;
      }

      // Gallery posts
      if (!imageUrl && post.is_gallery && post.media_metadata) {
        const firstKey = Object.keys(post.media_metadata)[0];
        if (firstKey) {
          const media = post.media_metadata[firstKey];
          if (media.s?.u) {
            imageUrl = media.s.u.replace(/&amp;/g, "&");
          }
        }
      }
    }

    // Get thumbnail as fallback image
    if (!imageUrl && post.thumbnail && post.thumbnail !== "self" && post.thumbnail !== "default") {
      imageUrl = post.thumbnail;
    }

    console.log("[Reddit] Result:", { videoUrl: !!videoUrl, imageUrl: !!imageUrl, audioUrl: !!audioUrl });

    if (!videoUrl && !imageUrl) {
      return NextResponse.json(
        { error: "No downloadable media found in this Reddit post. It might be a text post or link post." },
        { status: 422 }
      );
    }

    return NextResponse.json({
      videoUrl,
      imageUrl,
      audioUrl,
      title,
      type: videoUrl ? "video" : "image",
      subreddit: post.subreddit_name_prefixed || "",
      author: post.author || "",
    });
  } catch (error) {
    console.error("[Reddit] Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
