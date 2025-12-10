"use client";

import { motion } from "framer-motion";
import { PostCard } from "@/components/blog/post-card";
import { PageTransition } from "@/components/layout/page-transition";
import { staggerContainer } from "@/lib/animations";
import type { BlogPostMeta } from "@/lib/types";

type ReflectionsClientProps = {
  posts: BlogPostMeta[];
};

export function ReflectionsClient({ posts }: ReflectionsClientProps) {
  return (
    <PageTransition>
      <div className="min-h-screen pt-32 pb-20">
        <div className="mx-auto max-w-7xl px-6">
          {/* Header */}
          <div className="mb-16 max-w-3xl">
            <motion.p
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 text-cream/60 text-sm uppercase tracking-widest"
              initial={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5 }}
            >
              Journal
            </motion.p>
            <motion.h1
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 text-cream"
              initial={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Reflections
            </motion.h1>
            <motion.p
              animate={{ opacity: 1, y: 0 }}
              className="text-lg text-muted-foreground"
              initial={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Musings on light, shadow, and the ephemeral nature of moments.
              Essays on creativity, the craft of photography, and the stories
              behind the images.
            </motion.p>
          </div>

          {/* Posts Grid */}
          {posts.length > 0 ? (
            <motion.div
              animate="visible"
              className="grid gap-12 md:grid-cols-2 lg:grid-cols-3"
              initial="hidden"
              variants={staggerContainer}
            >
              {posts.map((post, index) => (
                <PostCard index={index} key={post.slug} post={post} />
              ))}
            </motion.div>
          ) : (
            <motion.div
              animate={{ opacity: 1 }}
              className="py-20 text-center"
              initial={{ opacity: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <p className="text-lg text-muted-foreground">
                New reflections coming soon...
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
