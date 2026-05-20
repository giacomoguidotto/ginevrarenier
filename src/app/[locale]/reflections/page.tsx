import { api } from "convex/_generated/api";
import { preloadQuery } from "convex/nextjs";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageBoundary } from "@/components/admin/page-boundary";
import { ReflectionsClient } from "./reflections-client";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "metadata.reflections",
  });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function ReflectionsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const preloadedPosts = await preloadQuery(api.blogPosts.listPublished, {});

  return (
    <PageBoundary page="reflections">
      <ReflectionsClient preloadedPosts={preloadedPosts} />
    </PageBoundary>
  );
}
