"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Calendar } from "lucide-react";
import Image from "next/image";
import { notFound, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ScrollProgress } from "@/components/blog/scroll-progress";
import { PageTransition } from "@/components/layout/page-transition";
import { Link } from "@/i18n/routing";
import { formatDate } from "@/lib/format";
import { useBlogPost, useLocalized } from "@/lib/hooks";

export function BlogPostClient() {
  const { slug } = useParams<{ slug: string }>();
  const { post, isLoading } = useBlogPost(slug);
  const t = useTranslations("common");
  const tr = useTranslations("reflections");
  const localized = useLocalized();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
      </div>
    );
  }

  if (!post) {
    notFound();
  }

  const title = localized(post.title);
  const excerpt = localized(post.excerpt);
  const content = localized(post.content);

  // Parse BlockNote JSON or render as plain text for now
  let paragraphs: string[] = [];
  try {
    const blocks = JSON.parse(content);
    if (Array.isArray(blocks)) {
      paragraphs = blocks
        .map(
          (block: { content?: { text?: string }[] }) =>
            block.content?.map((c) => c.text).join("") ?? ""
        )
        .filter(Boolean);
    }
  } catch {
    // Fallback: treat as plain text
    paragraphs = content.split("\n\n").filter((p) => p.trim());
  }

  return (
    <PageTransition>
      <ScrollProgress />

      <article className="min-h-screen pt-32 pb-20">
        <div className="mx-auto max-w-4xl px-6">
          {/* Back Link */}
          <motion.div
            animate={{ opacity: 1, x: 0 }}
            initial={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.5 }}
          >
            <Link
              className="mb-12 inline-flex items-center gap-2 text-muted-foreground text-sm uppercase tracking-widest transition-colors hover:text-foreground"
              href="/reflections"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>{t("backTo", { page: tr("title") })}</span>
            </Link>
          </motion.div>

          {/* Header */}
          <header className="mb-12">
            {/* Meta */}
            {post.publishedAt ? (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 flex flex-wrap items-center gap-4 text-muted-foreground text-sm"
                initial={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <time dateTime={new Date(post.publishedAt).toISOString()}>
                    {formatDate(new Date(post.publishedAt).toISOString())}
                  </time>
                </span>
              </motion.div>
            ) : null}

            {/* Title */}
            <motion.h1
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 font-light text-4xl text-foreground leading-tight md:text-5xl lg:text-6xl"
              initial={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {title}
            </motion.h1>

            {/* Excerpt */}
            <motion.p
              animate={{ opacity: 1, y: 0 }}
              className="text-muted-foreground text-xl"
              initial={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {excerpt}
            </motion.p>
          </header>

          {/* Cover Image */}
          {post.coverImageUrl ? (
            <motion.figure
              animate={{ opacity: 1, y: 0 }}
              className="relative mb-16 aspect-video overflow-hidden rounded-lg"
              initial={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Image
                alt={title}
                className="object-cover"
                fill
                priority
                sizes="(max-width: 896px) 100vw, 896px"
                src={post.coverImageUrl}
              />
            </motion.figure>
          ) : null}

          {/* Content */}
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="prose prose-lg prose-invert max-w-none"
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            {paragraphs.map((paragraph) => (
              <p
                className="mb-6 text-lg text-muted-foreground leading-relaxed"
                key={paragraph.slice(0, 50)}
              >
                {paragraph}
              </p>
            ))}
          </motion.div>

          {/* Footer */}
          <motion.footer
            animate={{ opacity: 1 }}
            className="mt-16 border-border border-t pt-8"
            initial={{ opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Link
              className="inline-flex items-center gap-2 text-muted-foreground text-sm uppercase tracking-widest transition-colors hover:text-foreground"
              href="/reflections"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>{t("backTo", { page: tr("title") })}</span>
            </Link>
          </motion.footer>
        </div>
      </article>
    </PageTransition>
  );
}
