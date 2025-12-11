"use client";

import { motion } from "framer-motion";
import { ArrowRight, Clock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { fadeUp } from "@/lib/animations";
import { formatDate } from "@/lib/format";
import type { BlogPostMeta } from "@/lib/types";

type PostCardProps = {
  post: BlogPostMeta;
  index: number;
};

export function PostCard({ post, index }: PostCardProps) {
  return (
    <motion.article className="group" custom={index} variants={fadeUp}>
      <Link
        className="block overflow-hidden rounded-lg"
        href={`/reflections/${post.slug}`}
      >
        {/* Image */}
        <div className="relative aspect-video overflow-hidden">
          <Image
            alt={post.title}
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            src={post.coverImage}
          />
          <div className="absolute inset-0 bg-linear-to-t from-background/60 via-transparent to-transparent" />
        </div>

        {/* Content */}
        <div className="mt-6 space-y-3">
          {/* Meta */}
          <div className="flex items-center gap-4 text-muted-foreground text-xs uppercase tracking-widest">
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {post.readingTime}
            </span>
          </div>

          {/* Title */}
          <h2 className="font-light text-2xl text-cream transition-colors group-hover:text-cream/80">
            {post.title}
          </h2>

          {/* Excerpt */}
          <p className="line-clamp-2 text-muted-foreground">{post.excerpt}</p>

          {/* Read More */}
          <div className="flex items-center gap-2 pt-2 text-cream/60 text-sm uppercase tracking-widest transition-colors group-hover:text-cream">
            <span>Read More</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
