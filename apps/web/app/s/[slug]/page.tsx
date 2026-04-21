import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { findShortLinkBySlug, incrementShortLinkClicks } from "@/lib/short-links-store";
import { PasswordForm } from "./password-form";

export const dynamic = "force-dynamic";

interface ShortLinkPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ShortLinkPage({ params }: ShortLinkPageProps) {
  const { slug } = await params;

  const shortLink = await findShortLinkBySlug(slug);

  if (!shortLink) {
    notFound();
  }

  if (shortLink.expiresAt && new Date() > new Date(shortLink.expiresAt)) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-xl items-center px-4 py-16">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Link expired</CardTitle>
            <CardDescription>
              This protected link is no longer available.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!shortLink.password) {
    await incrementShortLinkClicks(shortLink.slug);
    redirect(shortLink.originalUrl);
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl items-center px-4 py-16">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Password Protected Link</CardTitle>
          <CardDescription>
            Enter the password to open this link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordForm slug={slug} />
        </CardContent>
      </Card>
    </div>
  );
}
