import { NextResponse } from 'next/server';
import { getAuthUser } from '../../../lib/api-auth';
import { nanoid } from 'nanoid';
import bcrypt from 'bcryptjs';
import {
  createShortLink,
  findShortLinkBySlug,
  listShortLinksByUserId,
} from '@/lib/short-links-store';

const CUSTOM_SLUG_PATTERN = /^[a-z0-9_-]{3,64}$/;
const GUEST_LINK_TTL_MS = 24 * 60 * 60 * 1000;

function getBaseUrl(req: Request) {
  const host = req.headers.get('host') || 'kraaft.in';
  const protocol = req.headers.get('x-forwarded-proto') || 'https';
  return `${protocol}://${host}`;
}

export async function GET(req: Request) {
  try {
    let authUser;
    try {
      authUser = getAuthUser(req);
    } catch {
      return NextResponse.json({ error: 'Unauthorized', message: 'Unauthorized' }, { status: 401 });
    }

    const baseUrl = getBaseUrl(req);
    const links = await listShortLinksByUserId(authUser.userId);

    return NextResponse.json({
      success: true,
      data: links.map((link) => ({
        id: link.id,
        slug: link.slug,
        originalUrl: link.originalUrl,
        shortUrl: `${baseUrl}/s/${link.slug}`,
        clicks: link.clicks,
        hasPassword: Boolean(link.password),
        expiresAt: link.expiresAt?.toISOString(),
        createdAt: link.createdAt.toISOString(),
        updatedAt: link.updatedAt.toISOString(),
      })),
    });
  } catch (error: any) {
    console.error('Error fetching short links:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { originalUrl, slug, password, expiresAt, saveToAccount } = body;

    const normalizedOriginalUrl = typeof originalUrl === 'string' ? originalUrl.trim() : '';
    const normalizedCustomSlug =
      typeof slug === 'string' && slug.trim() !== '' ? slug.trim().toLowerCase() : undefined;

    console.log('Creating link for:', normalizedOriginalUrl);

    if (!normalizedOriginalUrl) {
      return NextResponse.json({ error: 'Original URL is required' }, { status: 400 });
    }

    try {
      const parsedUrl = new URL(normalizedOriginalUrl);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return NextResponse.json({ error: 'Only http and https URLs are supported' }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    if (normalizedCustomSlug && !CUSTOM_SLUG_PATTERN.test(normalizedCustomSlug)) {
      return NextResponse.json(
        { error: 'Custom slug must be 3-64 chars and use only lowercase letters, numbers, "_" or "-"' },
        { status: 400 }
      );
    }

    let userId: string | undefined;
    try {
      const user = getAuthUser(req);
      userId = user.userId;
    } catch (e) {
      // Guest user allowed
    }

    let finalSlug = normalizedCustomSlug;
    if (finalSlug) {
      const existing = await findShortLinkBySlug(finalSlug);
      if (existing) {
        return NextResponse.json({ error: 'Custom slug already taken' }, { status: 400 });
      }
    } else {
      let unique = false;
      let attempts = 0;
      while (!unique && attempts < 10) {
        finalSlug = nanoid(8);
        const existing = await findShortLinkBySlug(finalSlug);
        if (!existing) unique = true;
        attempts++;
      }
    }

    if (!finalSlug) {
      return NextResponse.json({ error: 'Could not generate a unique short link. Please try again.' }, { status: 500 });
    }

    const normalizedPassword = typeof password === 'string' ? password.trim() : '';

    const normalizedExpiresAt =
      typeof expiresAt === 'string' && expiresAt.trim() !== ''
        ? new Date(expiresAt)
        : undefined;

    if (normalizedExpiresAt && Number.isNaN(normalizedExpiresAt.getTime())) {
      return NextResponse.json({ error: 'Invalid expiry date format' }, { status: 400 });
    }

    if (normalizedExpiresAt && normalizedExpiresAt <= new Date()) {
      return NextResponse.json({ error: 'Expiry date must be in the future' }, { status: 400 });
    }

    const shouldSaveToAccount = Boolean(userId && saveToAccount === true);
    const finalUserId = shouldSaveToAccount ? userId : undefined;
    const guestAutoExpiry = new Date(Date.now() + GUEST_LINK_TTL_MS);
    const finalExpiresAt = finalUserId
      ? normalizedExpiresAt
      : normalizedExpiresAt && normalizedExpiresAt < guestAutoExpiry
        ? normalizedExpiresAt
        : guestAutoExpiry;

    let hashedPassword = undefined;
    if (normalizedPassword) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(normalizedPassword, salt);
    }

    const baseUrl = getBaseUrl(req);

    const shortLink = await createShortLink({
      slug: finalSlug,
      originalUrl: normalizedOriginalUrl,
      password: hashedPassword,
      expiresAt: finalExpiresAt,
      userId: finalUserId,
    });

    return NextResponse.json({
      success: true,
      slug: shortLink.slug,
      shortUrl: `${baseUrl}/s/${shortLink.slug}`,
      expiresAt: shortLink.expiresAt?.toISOString(),
      savedToAccount: shouldSaveToAccount,
    });
  } catch (error: any) {
    console.error('CRITICAL ERROR in /api/links:', {
      message: error.message,
      stack: error.stack,
      body: await req.clone().json().catch(() => 'could not parse body on error')
    });
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      message: 'Internal Server Error',
      details: error.message,
    }, { status: 500 });
  }
}
