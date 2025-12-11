"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ScrollProgress } from "@/components/blog/scroll-progress";
import { PageTransition } from "@/components/layout/page-transition";
import { formatDate } from "@/lib/format";
import type { BlogPost } from "@/lib/types";

type BlogPostClientProps = {
  post: BlogPost;
};

export function BlogPostClient({ post }: BlogPostClientProps) {
  const paragraphs = post.content.split("\n\n").filter((p) => p.trim());

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
              className="mb-12 inline-flex items-center gap-2 text-muted-foreground text-sm uppercase tracking-widest transition-colors hover:text-cream"
              href="/reflections"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Reflections</span>
            </Link>
          </motion.div>

          {/* Header */}
          <header className="mb-12">
            {/* Meta */}
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 flex flex-wrap items-center gap-4 text-muted-foreground text-sm"
              initial={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <time dateTime={post.date}>{formatDate(post.date)}</time>
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {post.readingTime}
              </span>
            </motion.div>

            {/* Title */}
            <motion.h1
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 font-light text-4xl text-cream leading-tight md:text-5xl lg:text-6xl"
              initial={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {post.title}
            </motion.h1>

            {/* Excerpt */}
            <motion.p
              animate={{ opacity: 1, y: 0 }}
              className="text-muted-foreground text-xl"
              initial={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {post.excerpt}
            </motion.p>
          </header>

          {/* Cover Image */}
          <motion.figure
            animate={{ opacity: 1, y: 0 }}
            className="relative mb-16 aspect-video overflow-hidden rounded-lg"
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Image
              alt={post.title}
              className="object-cover"
              fill
              priority
              sizes="(max-width: 896px) 100vw, 896px"
              src={post.coverImage}
            />
          </motion.figure>

          {/* Content */}
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="prose prose-lg prose-invert max-w-none"
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            {paragraphs.map((paragraph) => {
              const trimmed = paragraph.trim();
              const contentKey = trimmed.slice(0, 50);

              // Handle headers
              if (trimmed.startsWith("## ")) {
                return (
                  <h2
                    className="mt-12 mb-6 font-light text-3xl text-cream"
                    key={`h2-${contentKey}`}
                  >
                    {trimmed.replace("## ", "")}
                  </h2>
                );
              }
              if (trimmed.startsWith("### ")) {
                return (
                  <h3
                    className="mt-8 mb-4 font-light text-2xl text-cream"
                    key={`h3-${contentKey}`}
                  >
                    {trimmed.replace("### ", "")}
                  </h3>
                );
              }

              // Handle blockquotes
              if (trimmed.startsWith("> ")) {
                return (
                  <blockquote
                    className="my-8 border-cream/30 border-l-2 pl-6 text-cream/80 italic"
                    key={`quote-${contentKey}`}
                  >
                    {trimmed.replace(/^> /gm, "")}
                  </blockquote>
                );
              }

              // Regular paragraphs
              return (
                <p
                  className="mb-6 text-lg text-muted-foreground leading-relaxed"
                  key={`p-${contentKey}`}
                >
                  {trimmed}
                </p>
              );
            })}
          </motion.div>

          {/* Footer */}
          <motion.footer
            animate={{ opacity: 1 }}
            className="mt-16 border-border border-t pt-8"
            initial={{ opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Link
              className="inline-flex items-center gap-2 text-muted-foreground text-sm uppercase tracking-widest transition-colors hover:text-cream"
              href="/reflections"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>More Reflections</span>
            </Link>
          </motion.footer>
        </div>
      </article>
    </PageTransition>
  );
}
