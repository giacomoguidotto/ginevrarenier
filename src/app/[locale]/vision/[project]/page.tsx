import { auth } from "@clerk/nextjs/server";
import { api } from "convex/_generated/api";
import { fetchQuery } from "convex/nextjs";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { PageBoundary } from "@/components/admin/page-boundary";
import type { Locale } from "@/i18n/config";
import { BreadcrumbJsonLd, ImageGalleryJsonLd } from "@/lib/seo";
import { ProjectPageClient } from "./project-page-client";

interface Props {
  params: Promise<{ locale: string; project: string }>;
}

const baseUrl = "https://ginevrarenier.com";

async function getConvexToken() {
  const { getToken } = await auth();
  return (await getToken({ template: "convex" })) ?? undefined;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, project: slug } = await params;
  const token = await getConvexToken();
  const project = await fetchQuery(api.projects.getBySlug, { slug }, { token });

  if (!project) {
    return { title: "Not Found" };
  }

  const loc = locale as Locale;
  const title = loc === "it" ? project.title.it : project.title.en;
  const description =
    loc === "it"
      ? project.description.it || project.tagline.it
      : project.description.en || project.tagline.en;

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/${locale}/vision/${slug}`,
      languages: {
        en: `${baseUrl}/en/vision/${slug}`,
        it: `${baseUrl}/it/vision/${slug}`,
      },
    },
    openGraph: {
      type: "article",
      title,
      description,
      url: `${baseUrl}/${locale}/vision/${slug}`,
      locale: locale === "it" ? "it_IT" : "en_US",
      siteName: "Ginevra Renier Studio",
      ...(project.coverImageUrl
        ? {
            images: [
              {
                url: project.coverImageUrl,
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
      ...(project.coverImageUrl ? { images: [project.coverImageUrl] } : {}),
    },
  };
}

export default async function ProjectPage({ params }: Props) {
  const { locale, project: slug } = await params;
  setRequestLocale(locale);

  const token = await getConvexToken();
  const project = await fetchQuery(api.projects.getBySlug, { slug }, { token });
  const loc = locale as Locale;

  return (
    <PageBoundary page="project">
      {project && (
        <>
          <BreadcrumbJsonLd
            items={[
              {
                name: "Home",
                href: `/${locale}`,
              },
              {
                name: "Vision",
                href: `/${locale}/vision`,
              },
              {
                name: loc === "it" ? project.title.it : project.title.en,
                href: `/${locale}/vision/${slug}`,
              },
            ]}
          />
          <ImageGalleryJsonLd
            description={
              loc === "it" ? project.description.it : project.description.en
            }
            imageUrls={project.coverImageUrl ? [project.coverImageUrl] : []}
            locale={loc}
            name={loc === "it" ? project.title.it : project.title.en}
            url={`/${locale}/vision/${slug}`}
          />
        </>
      )}
      <ProjectPageClient />
    </PageBoundary>
  );
}
