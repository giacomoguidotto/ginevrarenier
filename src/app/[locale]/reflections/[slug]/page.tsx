import { auth } from "@clerk/nextjs/server";
import { api } from "convex/_generated/api";
import { fetchQuery } from "convex/nextjs";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { PageBoundary } from "@/components/admin/page-boundary";
import { type Locale, localePath, locales } from "@/i18n/config";
import { BlogPostingJsonLd, BreadcrumbJsonLd } from "@/lib/seo";
import { BlogPostClient } from "./blog-post-client";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

const baseUrl = "https://ginevrarenier.com";

async function getConvexToken() {
  const { getToken } = await auth();
  return (await getToken({ template: "convex" })) ?? undefined;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const token = await getConvexToken();
  const post = await fetchQuery(api.blogPosts.getBySlug, { slug }, { token });

  if (!post) {
    return { title: "Not Found" };
  }

  const loc = locale as Locale;
  const title = loc === "it" ? post.title.it : post.title.en;
  const description = loc === "it" ? post.excerpt.it : post.excerpt.en;

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}${localePath(locale, `/reflections/${slug}`)}`,
      languages: Object.fromEntries(
        locales.map((l) => [
          l,
          `${baseUrl}${localePath(l, `/reflections/${slug}`)}`,
        ])
      ),
    },
    openGraph: {
      type: "article",
      title,
      description,
      url: `${baseUrl}${localePath(locale, `/reflections/${slug}`)}`,
      locale: locale === "it" ? "it_IT" : "en_US",
      siteName: "Ginevra Renier Studio",
      ...(post.publishedAt
        ? { publishedTime: new Date(post.publishedAt).toISOString() }
        : {}),
      ...(post.coverImageUrl
        ? {
            images: [
              {
                url: post.coverImageUrl,
                width: 1200,
                height: 630,
                alt: title,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(post.coverImageUrl ? { images: [post.coverImageUrl] } : {}),
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const token = await getConvexToken();
  const post = await fetchQuery(api.blogPosts.getBySlug, { slug }, { token });
  const loc = locale as Locale;

  return (
    <PageBoundary page="post">
      {post && (
        <>
          <BreadcrumbJsonLd
            items={[
              {
                name: "Home",
                href: localePath(locale) || "/",
              },
              {
                name: loc === "it" ? "Riflessioni" : "Reflections",
                href: localePath(locale, "/reflections"),
              },
              {
                name: loc === "it" ? post.title.it : post.title.en,
                href: localePath(locale, `/reflections/${slug}`),
              },
            ]}
          />
          <BlogPostingJsonLd
            coverImageUrl={post.coverImageUrl ?? undefined}
            datePublished={
              post.publishedAt
                ? new Date(post.publishedAt).toISOString()
                : undefined
            }
            description={loc === "it" ? post.excerpt.it : post.excerpt.en}
            locale={loc}
            title={loc === "it" ? post.title.it : post.title.en}
            url={localePath(locale, `/reflections/${slug}`)}
          />
        </>
      )}
      <BlogPostClient />
    </PageBoundary>
  );
}
