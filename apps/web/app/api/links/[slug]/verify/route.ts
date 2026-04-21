import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { findShortLinkBySlug, incrementShortLinkClicks } from '@/lib/short-links-store';

interface VerifyRouteContext {
  params: Promise<{ slug: string }>;
}

export async function POST(req: Request, context: VerifyRouteContext) {
  try {
    const { slug } = await context.params;
    const body = await req.json();
    const password = typeof body?.password === 'string' ? body.password : '';

    const shortLink = await findShortLinkBySlug(slug);
    if (!shortLink) {
      return NextResponse.json({ error: 'Short link not found' }, { status: 404 });
    }

    if (shortLink.expiresAt && new Date() > new Date(shortLink.expiresAt)) {
      return NextResponse.json({ error: 'This link has expired' }, { status: 410 });
    }

    if (!shortLink.password) {
      await incrementShortLinkClicks(shortLink.slug);
      return NextResponse.json({ success: true, redirectUrl: shortLink.originalUrl });
    }

    if (!password.trim()) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    const isMatch = await bcrypt.compare(password, shortLink.password);
    if (!isMatch) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
    }

    await incrementShortLinkClicks(shortLink.slug);
    return NextResponse.json({ success: true, redirectUrl: shortLink.originalUrl });
  } catch (error: any) {
    console.error('Error verifying protected link:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
