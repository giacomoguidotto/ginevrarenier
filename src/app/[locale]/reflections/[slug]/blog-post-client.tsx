"use client";

import { api } from "convex/_generated/api";
import { useMutation } from "convex/react";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { notFound, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback } from "react";
import { useEditMode } from "@/components/admin/edit-mode-context";
import { EditableText } from "@/components/admin/editable-text";
import { ScrollProgress } from "@/components/blog/scroll-progress";
import { PageTransition } from "@/components/layout/page-transition";
import { Link } from "@/i18n/routing";
import { formatDate } from "@/lib/format";
import { useBlogPost, useLocalized } from "@/lib/hooks";

// Lazy load BlockNote to avoid SSR issues
const BlockEditor = dynamic(
  () =>
    import("@/components/admin/block-editor").then((mod) => mod.BlockEditor),
  { ssr: false }
);

export function BlogPostClient() {
  const { slug } = useParams<{ slug: string }>();
  const { post, isLoading } = useBlogPost(slug);
  const { isEditMode, editingLocale } = useEditMode();
  const t = useTranslations("common");
  const tr = useTranslations("reflections");
  const localized = useLocalized();
  const updatePost = useMutation(api.blogPosts.update);

  const handleContentChange = useCallback(
    (json: string) => {
      if (!post) {
        return;
      }
      updatePost({
        id: post._id,
        content: {
          ...post.content,
          [editingLocale]: json,
        },
      });
    },
    [post, editingLocale, updatePost]
  );

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
  const _excerpt = localized(post.excerpt);
  const content = isEditMode
    ? post.content[editingLocale]
    : localized(post.content);

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

            <motion.div
              animate={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <EditableText
                as="h1"
                className="mb-8 font-light text-4xl text-foreground leading-tight md:text-5xl lg:text-6xl"
                onChange={(v) => updatePost({ id: post._id, title: v })}
                value={post.title}
              />
            </motion.div>

            <motion.div
              animate={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <EditableText
                as="p"
                className="text-muted-foreground text-xl"
                multiline
                onChange={(v) => updatePost({ id: post._id, excerpt: v })}
                value={post.excerpt}
              />
            </motion.div>
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
            {isEditMode ? (
              <BlockEditor
                content={content}
                editable
                onChange={handleContentChange}
              />
            ) : (
              <BlockEditor content={content} editable={false} />
            )}
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
