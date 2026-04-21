import { NextRequest, NextResponse } from 'next/server';
import whois from 'whois-json';

export async function GET(req: NextRequest): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const domain = searchParams.get('domain');

  if (!domain) {
    return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
  }

  try {
    const results = await whois(domain);
    return NextResponse.json(results);
  } catch (error: any) {
    console.error('WHOIS Error:', error);
    return NextResponse.json({ error: 'Failed to fetch WHOIS data' }, { status: 500 });
  }
}
