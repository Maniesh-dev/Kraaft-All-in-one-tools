import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  try {
    // Basic validation of URL
    const url = new URL(targetUrl);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'AllInOneTools-Header-Checker/1.0',
      },
    });

    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    return NextResponse.json({
      status: response.status,
      statusText: response.statusText,
      headers: headers,
    });
  } catch (error: any) {
    console.error('Header Check Error:', error);
    return NextResponse.json({ error: 'Failed to fetch headers. Please check the URL and try again.' }, { status: 500 });
  }
}
