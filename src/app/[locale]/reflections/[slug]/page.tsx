import { setRequestLocale } from "next-intl/server";
import { BlogPostClient } from "./blog-post-client";

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export default async function BlogPostPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <BlogPostClient />;
}
