import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dbConnect from '@/lib/mongodb';
import ShortLink from '@/models/ShortLink';

const SHORT_LINKS_FILE = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '.data',
  'short-links.json'
);
const DB_CHECK_TTL_MS = 10_000;
const DB_CONNECT_TIMEOUT_MS = 2_500;
const MONGO_CLEANUP_TTL_MS = 60_000;

type FileShortLink = {
  id: string;
  slug: string;
  originalUrl: string;
  password?: string;
  expiresAt?: string;
  userId?: string;
  clicks: number;
  createdAt: string;
  updatedAt: string;
};

export type StoredShortLink = {
  id: string;
  slug: string;
  originalUrl: string;
  password?: string;
  expiresAt?: Date;
  userId?: string;
  clicks: number;
  createdAt: Date;
  updatedAt: Date;
};

type CreateShortLinkInput = {
  slug: string;
  originalUrl: string;
  password?: string;
  expiresAt?: Date;
  userId?: string;
};

let fileWriteQueue = Promise.resolve();
let mongoAvailabilityCache: { available: boolean; checkedAt: number } | null = null;
let mongoCleanupCheckedAt = 0;

function isExpiredDate(value?: Date | string) {
  if (!value) return false;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() <= Date.now();
}

function stripExpiredFileLinks(links: FileShortLink[]) {
  return links.filter((link) => !isExpiredDate(link.expiresAt));
}

function normalizeMongoShortLink(doc: any): StoredShortLink {
  return {
    id: String(doc._id),
    slug: doc.slug,
    originalUrl: doc.originalUrl,
    password: doc.password || undefined,
    expiresAt: doc.expiresAt ? new Date(doc.expiresAt) : undefined,
    userId: doc.userId || undefined,
    clicks: doc.clicks ?? 0,
    createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : new Date(),
  };
}

function normalizeFileShortLink(link: FileShortLink): StoredShortLink {
  return {
    id: link.id,
    slug: link.slug,
    originalUrl: link.originalUrl,
    password: link.password || undefined,
    expiresAt: link.expiresAt ? new Date(link.expiresAt) : undefined,
    userId: link.userId || undefined,
    clicks: link.clicks ?? 0,
    createdAt: new Date(link.createdAt),
    updatedAt: new Date(link.updatedAt),
  };
}

async function canUseMongo() {
  if (
    mongoAvailabilityCache &&
    Date.now() - mongoAvailabilityCache.checkedAt < DB_CHECK_TTL_MS
  ) {
    return mongoAvailabilityCache.available;
  }

  try {
    await Promise.race([
      dbConnect(),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Mongo connection timed out')), DB_CONNECT_TIMEOUT_MS);
      }),
    ]);

    mongoAvailabilityCache = { available: true, checkedAt: Date.now() };
    return true;
  } catch (error) {
    if (!mongoAvailabilityCache || mongoAvailabilityCache.available) {
      const message = error instanceof Error ? error.message : 'Unknown Mongo connection error';
      console.warn(`Short link store falling back to file storage: ${message}`);
    }

    mongoAvailabilityCache = { available: false, checkedAt: Date.now() };
    return false;
  }
}

async function cleanupExpiredMongoShortLinks() {
  if (!(await canUseMongo())) {
    return;
  }

  if (Date.now() - mongoCleanupCheckedAt < MONGO_CLEANUP_TTL_MS) {
    return;
  }

  mongoCleanupCheckedAt = Date.now();
  await ShortLink.deleteMany({ expiresAt: { $lte: new Date() } });
}

async function readFileShortLinks() {
  try {
    const raw = await readFile(SHORT_LINKS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as FileShortLink[]) : [];
  } catch (error: any) {
    if (error?.code === 'ENOENT') {
      return [];
    }

    throw error;
  }
}

async function writeFileShortLinks(links: FileShortLink[]) {
  await mkdir(path.dirname(SHORT_LINKS_FILE), { recursive: true });
  await writeFile(SHORT_LINKS_FILE, JSON.stringify(links, null, 2), 'utf8');
}

async function mutateFileShortLinks<T>(
  mutator: (links: FileShortLink[]) => Promise<{ links: FileShortLink[]; result: T }> | { links: FileShortLink[]; result: T }
) {
  const task = fileWriteQueue.then(async () => {
    const links = stripExpiredFileLinks(await readFileShortLinks());
    const { links: nextLinks, result } = await mutator(links);
    await writeFileShortLinks(nextLinks);
    return result;
  });

  fileWriteQueue = task.then(
    () => undefined,
    () => undefined
  );

  return task;
}

export async function findShortLinkBySlug(slug: string) {
  if (await canUseMongo()) {
    await cleanupExpiredMongoShortLinks();
    const mongoLink = await ShortLink.findOne({ slug });
    if (mongoLink) {
      if (isExpiredDate(mongoLink.expiresAt)) {
        await ShortLink.deleteOne({ _id: mongoLink._id });
        return null;
      }
      return normalizeMongoShortLink(mongoLink);
    }
  }

  return mutateFileShortLinks(async (links) => {
    const fileLink = links.find((link) => link.slug === slug);
    return {
      links,
      result: fileLink ? normalizeFileShortLink(fileLink) : null,
    };
  });
}

export async function listShortLinksByUserId(userId: string) {
  if (await canUseMongo()) {
    await cleanupExpiredMongoShortLinks();
    const mongoLinks = await ShortLink.find({
      userId,
      $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gt: new Date() } }],
    }).sort({ createdAt: -1 });

    return mongoLinks.map(normalizeMongoShortLink);
  }

  return mutateFileShortLinks(async (links) => {
    const userLinks = links
      .filter((link) => link.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map(normalizeFileShortLink);

    return {
      links,
      result: userLinks,
    };
  });
}

export async function createShortLink(input: CreateShortLinkInput) {
  if (await canUseMongo()) {
    await cleanupExpiredMongoShortLinks();
    const mongoLink = await ShortLink.create({
      slug: input.slug,
      originalUrl: input.originalUrl,
      password: input.password,
      expiresAt: input.expiresAt,
      userId: input.userId,
    });

    return normalizeMongoShortLink(mongoLink);
  }

  return mutateFileShortLinks(async (links) => {
    const now = new Date();
    const nextLink: FileShortLink = {
      id: randomUUID(),
      slug: input.slug,
      originalUrl: input.originalUrl,
      password: input.password,
      expiresAt: input.expiresAt?.toISOString(),
      userId: input.userId,
      clicks: 0,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    return {
      links: [...links, nextLink],
      result: normalizeFileShortLink(nextLink),
    };
  });
}

export async function incrementShortLinkClicks(slug: string) {
  if (await canUseMongo()) {
    await cleanupExpiredMongoShortLinks();
    const updated = await ShortLink.findOneAndUpdate(
      { slug },
      { $inc: { clicks: 1 } },
      { returnDocument: 'after' }
    );

    if (updated) {
      return normalizeMongoShortLink(updated);
    }
  }

  return mutateFileShortLinks(async (links) => {
    const nextLinks = links.map((link) =>
      link.slug === slug
        ? {
            ...link,
            clicks: (link.clicks ?? 0) + 1,
            updatedAt: new Date().toISOString(),
          }
        : link
    );

    const updated = nextLinks.find((link) => link.slug === slug);
    return {
      links: nextLinks,
      result: updated ? normalizeFileShortLink(updated) : null,
    };
  });
}
