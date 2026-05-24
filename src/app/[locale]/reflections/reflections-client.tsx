"use client";

import { api } from "convex/_generated/api";
import type { Doc } from "convex/_generated/dataModel";
import { preloadedQueryResult } from "convex/nextjs";
import type { Preloaded } from "convex/react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import { ArrowUpRight, EyeOff, Plus, Trash2, Undo2 } from "lucide-react";
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

function PostCardWrapper({
  post,
  index,
  isEditMode,
}: {
  post: Doc<"blogPosts">;
  index: number;
  isEditMode: boolean;
}) {
  const {
    trackDeletion,
    cancelDeletion,
    isPendingDeletion,
    getPublishOverride,
    setPublishOverride,
    clearPublishOverride,
  } = useDraftBufferOps();
  useEditVersion();
  const pendingDeletion = isPendingDeletion("post", post._id);

  const publishOverride = getPublishOverride("post", post._id);
  const effectivePublished =
    publishOverride === undefined ? post.published : publishOverride;

  const handleTogglePublish = () => {
    const target = !effectivePublished;
    if (target === post.published) {
      clearPublishOverride("post", post._id);
    } else {
      setPublishOverride("post", post._id, target);
    }
  };

  let contentClass = "";
  if (pendingDeletion) {
    contentClass = "opacity-30 grayscale";
  } else if (!effectivePublished) {
    contentClass = "opacity-50";
  }

  return (
    <motion.div
      className={isEditMode ? "relative h-full" : ""}
      variants={fadeUp}
    >
      <div className={isEditMode ? `h-full ${contentClass}` : ""}>
        <PostCard index={index} post={post} />
      </div>

      {isEditMode && pendingDeletion && (
        <button
          className="absolute top-2 right-2 z-10 flex items-center gap-1.5 rounded-full bg-destructive/90 px-3 py-1 font-medium text-[11px] text-white uppercase tracking-wider transition-all hover:bg-destructive hover:shadow-md"
          onClick={() => cancelDeletion("post", post._id)}
          type="button"
        >
          <Undo2 className="h-3 w-3" />
          Cancel deletion
        </button>
      )}

      {isEditMode && !pendingDeletion && publishOverride === true && (
        <button
          className="absolute top-2 right-2 z-10 flex items-center gap-1.5 rounded-full bg-foreground/20 px-3 py-1 font-medium text-[11px] text-foreground uppercase tracking-wider transition-all hover:bg-foreground/30 hover:shadow-md"
          onClick={handleTogglePublish}
          type="button"
        >
          <Undo2 className="h-3 w-3" />
          Cancel publish
        </button>
      )}

      {isEditMode && !pendingDeletion && publishOverride !== true && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5">
          <button
            className="flex items-center rounded-full bg-destructive/80 p-1.5 text-white transition-all hover:bg-destructive hover:shadow-md"
            onClick={() => trackDeletion("post", post._id)}
            type="button"
          >
            <Trash2 className="h-3 w-3" />
          </button>
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
        <EntityBadge
          pendingDeletion={pendingDeletion}
          published={post.published}
          publishOverride={publishOverride}
        />
      )}
    </motion.div>
  );
}

function EntityBadge({
  pendingDeletion,
  publishOverride,
  published,
}: {
  pendingDeletion: boolean;
  publishOverride: boolean | undefined;
  published: boolean;
}) {
  if (pendingDeletion) {
    return (
      <div className="absolute top-2 left-2 z-10 rounded bg-destructive/20 px-2 py-0.5 font-mono text-[10px] text-destructive uppercase backdrop-blur-sm">
        Pending deletion
      </div>
    );
  }
  if (publishOverride !== undefined) {
    return publishOverride ? (
      <div className="absolute top-2 left-2 z-10 rounded bg-primary/20 px-2 py-0.5 font-mono text-[10px] text-primary uppercase backdrop-blur-sm">
        Pending publish
      </div>
    ) : (
      <div className="absolute top-2 left-2 z-10 rounded bg-foreground/10 px-2 py-0.5 font-mono text-[10px] text-foreground/50 uppercase backdrop-blur-sm">
        Pending unpublish
      </div>
    );
  }
  if (!published) {
    return (
      <div className="absolute top-2 left-2 z-10 rounded bg-foreground/10 px-2 py-0.5 font-mono text-[10px] text-foreground/50 uppercase backdrop-blur-sm">
        Unpublished
      </div>
    );
  }
  return null;
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
            {posts.map((post, index) => (
              <PostCardWrapper
                index={index}
                isEditMode={isEditMode}
                key={post._id}
                post={post}
              />
            ))}

            {/* Create new post */}
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
