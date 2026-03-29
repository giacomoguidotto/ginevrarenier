"use client";

import type { Doc } from "convex/_generated/dataModel";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { fadeUp } from "@/lib/animations";
import { formatDate } from "@/lib/format";
import { useLocalized } from "@/lib/hooks";

interface PostCardProps {
  index: number;
  post: Doc<"blogPosts">;
}

export function PostCard({ post, index }: PostCardProps) {
  const t = useTranslations("reflections");
  const localized = useLocalized();

  return (
    <motion.article className="group" custom={index} variants={fadeUp}>
      <Link
        className="block overflow-hidden rounded-lg"
        href={`/reflections/${post.slug}`}
      >
        {/* Image */}
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

        {/* Content */}
        <div className="mt-6 space-y-3">
          {/* Meta */}
          {post.publishedAt ? (
            <div className="flex items-center gap-4 text-muted-foreground text-xs uppercase tracking-widest">
              <time dateTime={new Date(post.publishedAt).toISOString()}>
                {formatDate(new Date(post.publishedAt).toISOString())}
              </time>
            </div>
          ) : null}

          {/* Title */}
          <h2 className="font-light text-2xl text-foreground transition-colors group-hover:text-foreground/80">
            {localized(post.title)}
          </h2>

          {/* Excerpt */}
          <p className="line-clamp-2 text-muted-foreground">
            {localized(post.excerpt)}
          </p>

          {/* Read More */}
          <div className="flex items-center gap-2 pt-2 text-foreground/60 text-sm uppercase tracking-widest transition-colors group-hover:text-foreground">
            <span>{t("readMore")}</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
