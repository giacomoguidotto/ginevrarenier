"use client";

import type { Doc } from "convex/_generated/dataModel";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  ChromeEnablerProvider,
  useChromeEnabler,
} from "@/components/admin/chrome-enabler";
import { useEditMode } from "@/components/admin/edit-mode-context";
import { Field } from "@/components/admin/field";
import { Section } from "@/components/admin/section";
import { Link } from "@/i18n/routing";
import { fadeUp } from "@/lib/animations";
import { formatDate } from "@/lib/format";
import { useLocalized } from "@/lib/hooks";

interface PostCardProps {
  index: number;
  post: Doc<"blogPosts">;
}

export function PostCard({ post, index }: PostCardProps) {
  const { isEditMode } = useEditMode();

  return (
    <Section label={`Post: ${post.title.en}`} name={`post:${post._id}`}>
      <ChromeEnablerProvider active={isEditMode}>
        <PostCardContent index={index} post={post} />
      </ChromeEnablerProvider>
    </Section>
  );
}

function PostCardContent({ post, index }: PostCardProps) {
  const { isEditMode } = useEditMode();
  const { enable } = useChromeEnabler();
  const t = useTranslations("reflections");
  const localized = useLocalized();

  return (
    <motion.article
      className="group h-full"
      custom={index}
      onAnimationComplete={enable}
      variants={fadeUp}
    >
      <Link
        className="block h-full overflow-hidden rounded-lg bg-card shadow-sm transition-shadow duration-500 hover:shadow-md"
        href={`/reflections/${post.slug}`}
      >
        {post.coverImageUrl ? (
          <div className="relative aspect-video overflow-hidden">
            <Image
              alt={localized(post.title)}
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              src={post.coverImageUrl}
            />
            <div className="absolute inset-0 bg-linear-to-t from-background/60 via-transparent to-transparent" />
          </div>
        ) : null}

        {/* biome-ignore lint/a11y/noNoninteractiveElementInteractions: overlay intercepts events to prevent link navigation while editing */}
        {/* biome-ignore lint/a11y/noStaticElementInteractions: see above */}
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: defensive handler only */}
        <div
          className="space-y-3 p-6"
          onClick={
            isEditMode ? (e: React.MouseEvent) => e.preventDefault() : undefined
          }
          onPointerDown={
            isEditMode
              ? (e: React.PointerEvent) => e.stopPropagation()
              : undefined
          }
        >
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
                {localized(post.excerpt) || " "}
              </p>
            </>
          )}

          <div className="flex items-center gap-2 pt-2 text-foreground/60 text-sm uppercase tracking-widest transition-colors group-hover:text-foreground">
            <span>{t("readMore")}</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
