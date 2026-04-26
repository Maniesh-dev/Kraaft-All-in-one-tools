import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  const filename = req.nextUrl.searchParams.get("filename") || "instagram-media";

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "*/*",
        Referer: "https://www.instagram.com/",
        Origin: "https://www.instagram.com",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch media file (${response.status})` },
        { status: response.status }
      );
    }

    const contentType =
      response.headers.get("content-type") || "application/octet-stream";
    const buffer = await response.arrayBuffer();

    // Determine extension from content type
    let extension = "bin";
    if (contentType.includes("video/mp4") || contentType.includes("video")) {
      extension = "mp4";
    } else if (contentType.includes("image/jpeg") || contentType.includes("image/jpg")) {
      extension = "jpg";
    } else if (contentType.includes("image/png")) {
      extension = "png";
    } else if (contentType.includes("image/webp")) {
      extension = "webp";
    } else if (url.includes(".mp4")) {
      extension = "mp4";
    } else if (url.includes(".jpg") || url.includes(".jpeg")) {
      extension = "jpg";
    } else if (url.includes(".png")) {
      extension = "png";
    } else if (url.includes(".webp")) {
      extension = "webp";
    }

    const finalFilename = filename.endsWith(`.${extension}`)
      ? filename
      : `${filename}.${extension}`;

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${finalFilename}"`,
        "Content-Length": buffer.byteLength.toString(),
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error: any) {
    console.error("Proxy Error:", error);
    return NextResponse.json(
      { error: "Failed to proxy media" },
      { status: 500 }
    );
  }
}

// Support HEAD requests for preflight checks
export async function HEAD(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return new NextResponse(null, { status: 400 });
  }

  try {
    const response = await fetch(url, {
      method: "HEAD",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Referer: "https://www.instagram.com/",
      },
      redirect: "follow",
    });

    return new NextResponse(null, {
      status: response.ok ? 200 : response.status,
      headers: {
        "Content-Type": response.headers.get("content-type") || "application/octet-stream",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return new NextResponse(null, { status: 500 });
  }
}
