"use client";

import type { Doc } from "convex/_generated/dataModel";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, EyeOff, Trash2, Undo2 } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  ChromeEnablerProvider,
  useChromeEnabler,
} from "@/components/admin/chrome-enabler";
import {
  useDraftBufferOps,
  useEditVersion,
} from "@/components/admin/draft-buffer-context";
import { useEditMode } from "@/components/admin/edit-mode-context";
import { Field } from "@/components/admin/field";
import { Section } from "@/components/admin/section";
import { StatusBadge } from "@/components/admin/status-badge";
import { Link } from "@/i18n/routing";
import { fadeUp } from "@/lib/animations";
import { formatDate } from "@/lib/format";
import { useLocalized } from "@/lib/hooks";

export function PostCard({
  post,
  index,
  pendingDeletion,
  onDelete,
  onCancelDeletion,
}: {
  post: Doc<"blogPosts">;
  index: number;
  pendingDeletion?: boolean;
  onDelete?: () => void;
  onCancelDeletion?: () => void;
}) {
  const { isEditMode } = useEditMode();

  return (
    <Section label={`Post: ${post.title.en}`} name={`post:${post._id}`}>
      <ChromeEnablerProvider active={isEditMode}>
        <CardContent
          index={index}
          onCancelDeletion={onCancelDeletion}
          onDelete={onDelete}
          pendingDeletion={pendingDeletion}
          post={post}
        />
      </ChromeEnablerProvider>
    </Section>
  );
}

function CardContent({
  post,
  index,
  pendingDeletion,
  onDelete,
  onCancelDeletion,
}: {
  post: Doc<"blogPosts">;
  index: number;
  pendingDeletion?: boolean;
  onDelete?: () => void;
  onCancelDeletion?: () => void;
}) {
  const { isEditMode } = useEditMode();
  const { enable } = useChromeEnabler();
  const t = useTranslations("reflections");
  const localized = useLocalized();
  const { getPublishOverride, setPublishOverride, clearPublishOverride } =
    useDraftBufferOps();
  useEditVersion();

  const publishOverride = getPublishOverride("post", post._id);
  const effectivePublished =
    publishOverride === undefined ? post.published : publishOverride;

  let contentClass = "";
  if (isEditMode) {
    if (pendingDeletion) {
      contentClass = "opacity-30 grayscale";
    } else if (!effectivePublished) {
      contentClass = "opacity-50";
    }
  }

  const handleTogglePublish = () => {
    const target = !effectivePublished;
    if (target === post.published) {
      clearPublishOverride("post", post._id);
    } else {
      setPublishOverride("post", post._id, target);
    }
  };

  return (
    <motion.div
      className={`group relative h-full ${isEditMode ? "edit-locked" : ""}`}
      custom={index}
      onAnimationComplete={enable}
      variants={fadeUp}
    >
      <Link
        className={`block h-full overflow-hidden rounded-lg bg-card shadow-sm transition-shadow duration-500 hover:shadow-md ${contentClass}`}
        href={`/reflections/${post.slug}`}
      >
        <div className="relative flex h-full min-h-[220px] flex-col">
          {post.coverImageUrl ? (
            <>
              <Image
                alt={localized(post.title)}
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                src={post.coverImageUrl}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-30% from-card via-55% via-card/80 to-transparent" />
            </>
          ) : null}

          {/* biome-ignore lint/a11y/noNoninteractiveElementInteractions: overlay intercepts events to prevent link navigation while editing */}
          {/* biome-ignore lint/a11y/noStaticElementInteractions: see above */}
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: defensive handler only */}
          <div
            className="relative z-10 flex flex-1 flex-col justify-between space-y-3 p-6"
            onClick={
              isEditMode
                ? (e: React.MouseEvent) => {
                    if (!(e.target as HTMLElement).closest("[data-navigate]")) {
                      e.preventDefault();
                    }
                  }
                : undefined
            }
            onPointerDown={
              isEditMode
                ? (e: React.PointerEvent) => e.stopPropagation()
                : undefined
            }
          >
            <div className="max-w-[70%] space-y-3">
              {post.publishedAt ? (
                <div className="flex items-center gap-4 text-muted-foreground text-xs uppercase tracking-widest">
                  <time dateTime={new Date(post.publishedAt).toISOString()}>
                    {formatDate(new Date(post.publishedAt).toISOString())}
                  </time>
                </div>
              ) : null}

              {isEditMode ? (
                <>
                  <Field
                    as="h3"
                    className="font-light text-foreground"
                    name="title"
                  />
                  <Field
                    as="p"
                    className="line-clamp-2 text-muted-foreground"
                    multiline
                    name="excerpt"
                  />
                </>
              ) : (
                <>
                  <h3 className="font-light text-foreground transition-colors group-hover:text-foreground/80">
                    {localized(post.title)}
                  </h3>
                  <p className="line-clamp-2 text-muted-foreground">
                    {localized(post.excerpt) || " "}
                  </p>
                </>
              )}
            </div>

            <div
              className="flex items-center gap-2 pt-2 text-foreground/60 text-sm uppercase tracking-widest transition-colors group-hover:text-foreground"
              data-navigate
            >
              <span>{t("readMore")}</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </div>
      </Link>

      {isEditMode && pendingDeletion && onCancelDeletion && (
        <button
          className="absolute top-6 right-6 z-10 flex items-center gap-1.5 rounded-full bg-destructive/90 px-3 py-1 font-medium text-[11px] text-white uppercase tracking-wider transition-all hover:bg-destructive hover:shadow-md"
          onClick={onCancelDeletion}
          onPointerDown={(e) => e.stopPropagation()}
          type="button"
        >
          <Undo2 className="h-3 w-3" />
          Cancel deletion
        </button>
      )}

      {isEditMode && !pendingDeletion && publishOverride === true && (
        <button
          className="absolute top-6 right-6 z-10 flex items-center gap-1.5 rounded-full bg-foreground/20 px-3 py-1 font-medium text-[11px] text-foreground uppercase tracking-wider transition-all hover:bg-foreground/30 hover:shadow-md"
          onClick={handleTogglePublish}
          onPointerDown={(e) => e.stopPropagation()}
          type="button"
        >
          <Undo2 className="h-3 w-3" />
          Cancel publish
        </button>
      )}

      {isEditMode && !pendingDeletion && publishOverride !== true && (
        <div
          className="absolute top-6 right-6 z-10 flex items-center gap-1.5"
          onPointerDown={(e) => e.stopPropagation()}
        >
          {onDelete && (
            <button
              className="flex items-center rounded-full bg-destructive/80 p-1.5 text-white transition-all hover:bg-destructive hover:shadow-md"
              onClick={onDelete}
              type="button"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
          {effectivePublished ? (
            <button
              className="flex items-center gap-1.5 rounded-full bg-foreground/20 px-3 py-1 font-medium text-[11px] text-foreground uppercase tracking-wider transition-all hover:bg-foreground/30 hover:shadow-md"
              onClick={handleTogglePublish}
              type="button"
            >
              <EyeOff className="h-3 w-3" />
              Unpublish
            </button>
          ) : (
            <button
              className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 font-medium text-[11px] text-primary-foreground uppercase tracking-wider transition-all hover:bg-primary/90 hover:shadow-md"
              onClick={handleTogglePublish}
              type="button"
            >
              <ArrowUpRight className="h-3 w-3" />
              Publish
            </button>
          )}
        </div>
      )}

      {isEditMode && (
        <StatusBadge
          className="top-6 left-6"
          pendingDeletion={pendingDeletion}
          published={post.published}
          publishOverride={publishOverride}
        />
      )}
    </motion.div>
  );
}
