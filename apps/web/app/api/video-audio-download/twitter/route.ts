import { NextRequest, NextResponse } from "next/server";

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "*/*",
};

/**
 * Extract tweet ID from various Twitter/X URL formats
 */
function extractTweetId(url: string): string | null {
  const match = url.match(
    /(?:twitter\.com|x\.com)\/[^/]+\/status\/(\d+)/i
  );
  return match ? match[1]! : null;
}

/**
 * Extract username from URL
 */
function extractUsername(url: string): string | null {
  const match = url.match(
    /(?:twitter\.com|x\.com)\/([^/]+)\/status/i
  );
  return match ? match[1]! : null;
}

// ─── Strategy 1: fxtwitter API ───────────────────────────
async function tryFxTwitter(tweetId: string, username: string) {
  try {
    const apiUrl = `https://api.fxtwitter.com/${username}/status/${tweetId}`;
    const response = await fetch(apiUrl, { headers: BROWSER_HEADERS });

    if (!response.ok) {
      console.log(`[Twitter][fxtwitter] returned ${response.status}`);
      return null;
    }

    const data = await response.json();
    const tweet = data?.tweet;
    if (!tweet) return null;

    const media = tweet.media;
    let videoUrl: string | null = null;
    let imageUrl: string | null = null;

    if (media?.videos?.length) {
      // Get the best quality video
      const video = media.videos[0];
      videoUrl = video.url || null;
      imageUrl = video.thumbnail_url || media.photos?.[0]?.url || null;
    } else if (media?.photos?.length) {
      imageUrl = media.photos[0].url || null;
    }

    if (videoUrl || imageUrl) {
      return {
        videoUrl,
        imageUrl,
        title: tweet.text?.substring(0, 120) || "Twitter/X Media",
        type: videoUrl ? "video" as const : "image" as const,
        author: tweet.author?.name || username,
      };
    }

    return null;
  } catch (error) {
    console.error("[Twitter][fxtwitter] error:", error);
    return null;
  }
}

// ─── Strategy 2: vxtwitter API ───────────────────────────
async function tryVxTwitter(tweetId: string, username: string) {
  try {
    const apiUrl = `https://api.vxtwitter.com/${username}/status/${tweetId}`;
    const response = await fetch(apiUrl, { headers: BROWSER_HEADERS });

    if (!response.ok) return null;

    const data = await response.json();

    let videoUrl: string | null = null;
    let imageUrl: string | null = null;

    if (data.media_extended?.length) {
      for (const m of data.media_extended) {
        if (m.type === "video" && m.url) {
          videoUrl = m.url;
          imageUrl = m.thumbnail_url || null;
          break;
        } else if (m.type === "image" && m.url) {
          imageUrl = m.url;
        }
      }
    }

    if (videoUrl || imageUrl) {
      return {
        videoUrl,
        imageUrl,
        title: data.text?.substring(0, 120) || "Twitter/X Media",
        type: videoUrl ? "video" as const : "image" as const,
        author: data.user_name || username,
      };
    }

    return null;
  } catch (error) {
    console.error("[Twitter][vxtwitter] error:", error);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    if (!url.match(/(?:twitter\.com|x\.com)/i)) {
      return NextResponse.json(
        { error: "Please enter a valid Twitter/X URL" },
        { status: 400 }
      );
    }

    const tweetId = extractTweetId(url);
    const username = extractUsername(url);

    if (!tweetId || !username) {
      return NextResponse.json(
        { error: "Could not extract tweet ID. Please use a direct tweet URL." },
        { status: 400 }
      );
    }

    console.log(`\n[Twitter] Processing tweet: ${tweetId} by @${username}`);

    // Try fxtwitter first
    let result = await tryFxTwitter(tweetId, username);
    if (result) return NextResponse.json(result);

    // Fallback to vxtwitter
    result = await tryVxTwitter(tweetId, username);
    if (result) return NextResponse.json(result);

    return NextResponse.json(
      { error: "Could not extract media from this tweet. Make sure it contains a video or image and is public." },
      { status: 422 }
    );
  } catch (error) {
    console.error("[Twitter] Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
