"use client";

import { api } from "convex/_generated/api";
import type { Doc } from "convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Plus, Trash2, Undo2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { useDraftBufferOps } from "@/components/admin/draft-buffer-context";
import { useEditMode } from "@/components/admin/edit-mode-context";
import { Field } from "@/components/admin/field";
import {
  FieldVisibilityProvider,
  useFieldVisibility,
} from "@/components/admin/field-visibility";
import { Section, useSection } from "@/components/admin/section";
import { PostCard } from "@/components/blog/post-card";
import { PageTransition } from "@/components/layout/page-transition";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
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
  const { trackDeletion, cancelDeletion, isPendingDeletion } =
    useDraftBufferOps();
  const updatePost = useMutation(api.blogPosts.update);
  const pendingDeletion = isPendingDeletion("post", post._id);

  let stateClass = "";
  if (pendingDeletion) {
    stateClass = "opacity-30 grayscale";
  } else if (!post.published) {
    stateClass = "opacity-50";
  }

  if (!isEditMode) {
    return (
      <motion.div variants={fadeUp}>
        <PostCard index={index} post={post} />
      </motion.div>
    );
  }

  return (
    <motion.div variants={fadeUp}>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div className={`relative ${stateClass}`}>
            <PostCard index={index} post={post} />
            <EntityBadge
              pendingDeletion={pendingDeletion}
              published={post.published}
            />
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem
            onClick={() =>
              updatePost({ id: post._id, published: !post.published })
            }
          >
            {post.published ? (
              <>
                <EyeOff className="mr-2 h-4 w-4" /> Unpublish
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" /> Publish
              </>
            )}
          </ContextMenuItem>
          {pendingDeletion ? (
            <ContextMenuItem onClick={() => cancelDeletion("post", post._id)}>
              <Undo2 className="mr-2 h-4 w-4" />
              Cancel deletion
            </ContextMenuItem>
          ) : (
            <ContextMenuItem
              className="text-red-400 focus:text-red-400"
              onClick={() => trackDeletion("post", post._id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </ContextMenuItem>
          )}
        </ContextMenuContent>
      </ContextMenu>
    </motion.div>
  );
}

function EntityBadge({
  pendingDeletion,
  published,
}: {
  pendingDeletion: boolean;
  published: boolean;
}) {
  if (pendingDeletion) {
    return (
      <div className="absolute top-2 left-2 rounded bg-red-500/20 px-2 py-0.5 font-mono text-[10px] text-red-400 uppercase backdrop-blur-sm">
        Pending deletion
      </div>
    );
  }
  if (!published) {
    return (
      <div className="absolute top-2 left-2 rounded bg-foreground/10 px-2 py-0.5 font-mono text-[10px] text-foreground/50 uppercase backdrop-blur-sm">
        Draft
      </div>
    );
  }
  return null;
}

export function ReflectionsClient() {
  const t = useTranslations("reflections");
  const { isEditMode } = useEditMode();

  const allPosts = useQuery(api.blogPosts.list);
  const publishedPosts = useQuery(api.blogPosts.listPublished);
  const posts = isEditMode ? (allPosts ?? []) : (publishedPosts ?? []);

  const { trackCreation } = useDraftBufferOps();
  const createPost = useMutation(api.blogPosts.create);

  const [creating, setCreating] = useState(false);
  const [newSlug, setNewSlug] = useState("");

  const handleCreate = useCallback(async () => {
    if (!newSlug.trim()) {
      return;
    }
    const slug = newSlug.trim().toLowerCase().replace(/\s+/g, "-");
    const id = await createPost({
      slug,
      title: { en: slug, it: slug },
      excerpt: { en: "", it: "" },
    });
    trackCreation("post", id);
    setNewSlug("");
    setCreating(false);
  }, [newSlug, createPost, trackCreation]);

  return (
    <PageTransition>
      <div className="min-h-screen pt-32 pb-20">
        <div className="mx-auto max-w-7xl px-6">
          {/* Header */}
          <Section name="reflections.header">
            <FieldVisibilityProvider>
              <ReflectionsHeader />
            </FieldVisibilityProvider>
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
                {creating ? (
                  <div className="flex aspect-video flex-col items-center justify-center gap-4 rounded-lg border-2 border-foreground/15 border-dashed p-6">
                    <input
                      autoFocus
                      className="w-full rounded bg-transparent px-3 py-2 text-center text-foreground outline-none ring-1 ring-foreground/20 placeholder:text-foreground/30 focus:ring-foreground/40"
                      onChange={(e) => setNewSlug(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleCreate();
                        }
                        if (e.key === "Escape") {
                          setCreating(false);
                          setNewSlug("");
                        }
                      }}
                      placeholder="post-slug"
                      value={newSlug}
                    />
                    <div className="flex gap-2">
                      <button
                        className="rounded-full bg-foreground/10 px-4 py-1.5 text-foreground text-xs transition-colors hover:bg-foreground/20"
                        onClick={handleCreate}
                        type="button"
                      >
                        Create
                      </button>
                      <button
                        className="rounded-full px-4 py-1.5 text-foreground/50 text-xs transition-colors hover:text-foreground"
                        onClick={() => {
                          setCreating(false);
                          setNewSlug("");
                        }}
                        type="button"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    className="flex aspect-video w-full items-center justify-center rounded-lg border-2 border-foreground/15 border-dashed text-foreground/30 transition-colors hover:border-foreground/30 hover:text-foreground/50"
                    onClick={() => setCreating(true)}
                    type="button"
                  >
                    <Plus className="h-8 w-8" />
                  </button>
                )}
              </motion.div>
            ) : null}
          </motion.div>

          {posts.length === 0 && !isEditMode ? (
            <motion.div
              animate={{ opacity: 1 }}
              className="py-20 text-center"
              initial={{ opacity: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <p className="text-lg text-muted-foreground">{t("empty")}</p>
            </motion.div>
          ) : null}
        </div>
      </div>
    </PageTransition>
  );
}

function ReflectionsHeader() {
  const { markVisible } = useFieldVisibility();
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
        onAnimationComplete={markVisible}
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
