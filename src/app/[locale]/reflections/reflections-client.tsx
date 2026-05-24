"use client";

import { api } from "convex/_generated/api";
import type { Doc } from "convex/_generated/dataModel";
import { preloadedQueryResult } from "convex/nextjs";
import type { Preloaded } from "convex/react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useCallback } from "react";
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
import { Section, useSection } from "@/components/admin/section";
import { PostCard } from "@/components/blog/post-card";
import { ReflectionsEmptyState } from "@/components/empty-states/reflections-empty-state";
import { PageTransition } from "@/components/layout/page-transition";
import { fadeUp, staggerContainer } from "@/lib/animations";
import { useLocalized } from "@/lib/hooks";

function PostCardEntry({
  post,
  index,
}: {
  post: Doc<"blogPosts">;
  index: number;
}) {
  const { isPendingDeletion, trackDeletion, cancelDeletion } =
    useDraftBufferOps();
  useEditVersion();

  return (
    <PostCard
      index={index}
      onCancelDeletion={() => cancelDeletion("post", post._id)}
      onDelete={() => trackDeletion("post", post._id)}
      pendingDeletion={isPendingDeletion("post", post._id)}
      post={post}
    />
  );
}

export function ReflectionsClient({
  preloadedPosts,
}: {
  preloadedPosts?: Preloaded<typeof api.blogPosts.listPublished>;
}) {
  const { isEditMode } = useEditMode();
  const { isAuthenticated } = useConvexAuth();

  const allPosts = useQuery(api.blogPosts.list, isAuthenticated ? {} : "skip");
  const publishedPosts = useQuery(api.blogPosts.listPublished);
  const preloaded = preloadedPosts
    ? preloadedQueryResult(preloadedPosts)
    : undefined;
  const posts = isEditMode
    ? (allPosts ?? publishedPosts ?? preloaded ?? [])
    : (publishedPosts ?? preloaded ?? []);

  const { trackCreation } = useDraftBufferOps();
  const createPost = useMutation(api.blogPosts.create);

  const handleCreate = useCallback(async () => {
    const titles = [
      "Reverie",
      "Threshold",
      "Coda",
      "Interlude",
      "Parenthesis",
      "Caesura",
      "Marginalia",
      "Palimpsest",
      "Fugue",
      "Ellipsis",
      "Postlude",
      "Lacuna",
      "Tessera",
      "Sotto Voce",
      "Filigree",
      "Interstice",
      "Resonance",
      "Apocrypha",
      "Etude",
      "Fermata",
      "Rubato",
      "Sforzando",
      "Glissando",
      "Ostinato",
      "Clair-Obscur",
    ];
    const title = titles[Math.floor(Math.random() * titles.length)];
    const id = await createPost({
      title: { en: title, it: title },
    });
    trackCreation("post", id);
  }, [createPost, trackCreation]);

  return (
    <PageTransition>
      <div className="min-h-screen pt-32 pb-20">
        <div className="mx-auto max-w-7xl px-6">
          {/* Header */}
          <Section label="Reflections" name="reflections.header">
            <ChromeEnablerProvider>
              <ReflectionsHeader />
            </ChromeEnablerProvider>
          </Section>

          {/* Posts Grid */}
          <motion.div
            animate="visible"
            className="grid gap-12 md:grid-cols-2 lg:grid-cols-3"
            initial="hidden"
            variants={staggerContainer}
          >
            {isEditMode ? (
              <motion.div variants={fadeUp}>
                <button
                  className="flex h-full min-h-48 w-full items-center justify-center rounded-lg border-2 border-foreground/15 border-dashed text-foreground/30 transition-colors hover:border-foreground/30 hover:text-foreground/50"
                  onClick={handleCreate}
                  type="button"
                >
                  <Plus className="h-8 w-8" />
                </button>
              </motion.div>
            ) : null}

            {posts.map((post, index) => (
              <PostCardEntry index={index} key={post._id} post={post} />
            ))}
          </motion.div>

          {posts.length === 0 ? <ReflectionsEmptyState /> : null}
        </div>
      </div>
    </PageTransition>
  );
}

function ReflectionsHeader() {
  const { enable } = useChromeEnabler();
  const { data } = useSection();
  const localized = useLocalized();

  return (
    <div className="mb-16 max-w-3xl">
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.5 }}
      >
        <Field
          as="p"
          className="mb-4 text-foreground/60 text-sm uppercase tracking-widest"
          name="label"
        />
      </motion.div>
      <motion.h1
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 text-foreground"
        initial={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {data?.title && localized(data.title)}
      </motion.h1>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: 20 }}
        onAnimationComplete={enable}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Field
          as="p"
          className="text-lg text-muted-foreground"
          name="description"
        />
      </motion.div>
    </div>
  );
}
