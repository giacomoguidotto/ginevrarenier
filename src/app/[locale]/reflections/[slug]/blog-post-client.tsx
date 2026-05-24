"use client";

import { api } from "convex/_generated/api";
import { useMutation } from "convex/react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowUpRight, Calendar, EyeOff } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { notFound, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback } from "react";
import {
  useDraftBufferOps,
  useEditVersion,
} from "@/components/admin/draft-buffer-context";
import { useEditMode } from "@/components/admin/edit-mode-context";
import { Field } from "@/components/admin/field";
import { Section } from "@/components/admin/section";
import { useStableEntity } from "@/components/admin/use-stable-entity";
import { ScrollProgress } from "@/components/blog/scroll-progress";
import { PageTransition } from "@/components/layout/page-transition";
import { Link } from "@/i18n/routing";
import { formatDate } from "@/lib/format";
import { useLocalized } from "@/lib/hooks";

const BlockEditor = dynamic(
  () =>
    import("@/components/admin/block-editor").then((mod) => mod.BlockEditor),
  { ssr: false }
);

export function BlogPostClient() {
  const { slug } = useParams<{ slug: string }>();
  const { id: postId, entity: post, isLoading } = useStableEntity("post", slug);
  const { isEditMode, editingLocale } = useEditMode();
  const { getPublishOverride, setPublishOverride, clearPublishOverride } =
    useDraftBufferOps();
  useEditVersion();
  const t = useTranslations("common");
  const tr = useTranslations("reflections");
  const localized = useLocalized();
  const updatePost = useMutation(api.blogPosts.update);

  const handleContentChange = useCallback(
    (json: string) => {
      if (!postId) {
        return;
      }
      const postData = post as Record<string, unknown> | undefined;
      const content = postData?.content as
        | { en: string; it: string }
        | undefined;
      if (!content) {
        return;
      }
      updatePost({
        id: postId as never,
        content: {
          ...content,
          [editingLocale]: json,
        },
      });
    },
    [postId, post, editingLocale, updatePost]
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

  const postData = post as Record<string, unknown>;
  const postTitle = postData.title as { en: string; it: string };
  const postContent = postData.content as { en: string; it: string };
  const postCoverImageUrl = postData.coverImageUrl as string | undefined;
  const postPublishedAt = postData.publishedAt as number | undefined;
  const postPublished = postData.published as boolean;

  const publishOverride = postId
    ? getPublishOverride("post", postId as never)
    : undefined;
  const effectivePublished =
    publishOverride === undefined ? postPublished : publishOverride;

  const handleTogglePublish = () => {
    if (!postId) {
      return;
    }
    const target = !effectivePublished;
    if (target === postPublished) {
      clearPublishOverride("post", postId as never);
    } else {
      setPublishOverride("post", postId as never, target);
    }
  };

  const title = localized(postTitle);
  const content = isEditMode
    ? postContent[editingLocale]
    : localized(postContent);

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
          <Section label={`Post: ${postTitle.en}`} name={`post:${postId}`}>
            <header className="mb-12">
              {postPublishedAt ? (
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 flex flex-wrap items-center gap-4 text-muted-foreground text-sm"
                  initial={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    <time dateTime={new Date(postPublishedAt).toISOString()}>
                      {formatDate(new Date(postPublishedAt).toISOString())}
                    </time>
                  </span>
                </motion.div>
              ) : null}

              {isEditMode && (
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.5, delay: 0.15 }}
                >
                  {effectivePublished ? (
                    <button
                      className="flex items-center gap-1.5 rounded-full bg-foreground/20 px-4 py-1.5 font-medium text-foreground text-xs uppercase tracking-wider transition-all hover:bg-foreground/30 hover:shadow-md"
                      onClick={handleTogglePublish}
                      type="button"
                    >
                      <EyeOff className="h-3.5 w-3.5" />
                      Unpublish
                    </button>
                  ) : (
                    <button
                      className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 font-medium text-primary-foreground text-xs uppercase tracking-wider transition-all hover:bg-primary/90 hover:shadow-md"
                      onClick={handleTogglePublish}
                      type="button"
                    >
                      <ArrowUpRight className="h-3.5 w-3.5" />
                      Publish
                    </button>
                  )}
                </motion.div>
              )}

              <motion.div
                animate={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Field
                  as="h1"
                  className="mb-8 font-light text-4xl text-foreground leading-tight md:text-5xl lg:text-6xl"
                  name="title"
                />
              </motion.div>

              <motion.div
                animate={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Field
                  as="p"
                  className="text-muted-foreground text-xl"
                  multiline
                  name="excerpt"
                />
              </motion.div>
            </header>
          </Section>

          {/* Cover Image */}
          {postCoverImageUrl ? (
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
                src={postCoverImageUrl}
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
