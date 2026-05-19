"use client";

import {
  AnimatePresence,
  motion,
  useScroll,
  useTransform,
} from "framer-motion";
import { ArrowRight, Award, Camera, Globe, Plus, Trash2 } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import {
  ChromeEnablerProvider,
  useChromeEnabler,
} from "@/components/admin/chrome-enabler";
import {
  useDraftBufferOps,
  useDraftBufferReset,
} from "@/components/admin/draft-buffer-context";
import { useEditMode } from "@/components/admin/edit-mode-context";
import { EditableImage } from "@/components/admin/editable-image";
import { Field } from "@/components/admin/field";
import { Section, useSection } from "@/components/admin/section";
import { PageTransition } from "@/components/layout/page-transition";
import { Link } from "@/i18n/routing";
import { useLocalized } from "@/lib/hooks";
import { createEntryWrites, deriveBufferedEntries } from "./timeline-entries";

const achievementIcons = [Camera, Award, Globe];
const achievementKeys = ["years", "recognition", "countries"] as const;

export function EssenceClient() {
  return (
    <PageTransition>
      <Section name="essence.hero">
        <ChromeEnablerProvider>
          <EssenceHero />
        </ChromeEnablerProvider>
      </Section>

      <Section name="essence.achievements">
        <ChromeEnablerProvider>
          <EssenceAchievements />
        </ChromeEnablerProvider>
      </Section>

      <Section name="essence.timeline">
        <ChromeEnablerProvider>
          <EssenceTimeline />
        </ChromeEnablerProvider>
      </Section>

      <Section name="essence.cta">
        <ChromeEnablerProvider>
          <EssenceCTA />
        </ChromeEnablerProvider>
      </Section>
    </PageTransition>
  );
}

function EssenceHero() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const imageY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, 50]);

  const { data } = useSection();
  const { write } = useDraftBufferOps();
  const { enable } = useChromeEnabler();
  const localized = useLocalized();

  const portraitUrl = data?.portraitImage?.en || undefined;
  const handlePortraitUpload = useCallback(
    (url: string) => {
      write("essence.hero", "portraitImage", "en", url);
      write("essence.hero", "portraitImage", "it", url);
    },
    [write]
  );

  return (
    <section
      className="relative min-h-screen overflow-hidden pt-32 pb-20 lg:pb-0"
      ref={heroRef}
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          <motion.div
            animate={{ opacity: 1, x: 0 }}
            className="relative z-[1] aspect-3/4 overflow-hidden rounded-lg lg:aspect-auto lg:h-[80vh]"
            initial={{ opacity: 0, x: -50 }}
            style={{ y: imageY }}
            transition={{ duration: 0.8 }}
          >
            <EditableImage
              alt="Ginevra Renier"
              folder="ginevrarenier/site"
              onUpload={handlePortraitUpload}
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              src={portraitUrl}
            />
          </motion.div>

          <motion.div
            className="flex flex-col justify-center lg:py-20"
            style={{ y: textY }}
          >
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Field
                as="p"
                className="mb-4 text-foreground/60 text-sm uppercase tracking-widest"
                name="label"
              />
            </motion.div>
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <h1 className="mb-8 text-foreground">
                {data?.title && localized(data.title)}
              </h1>
            </motion.div>
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 text-lg text-muted-foreground"
              initial={{ opacity: 0, y: 20 }}
              onAnimationComplete={enable}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Field as="p" multiline name="bio" />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function EssenceAchievements() {
  const { enable } = useChromeEnabler();

  return (
    <section className="bg-charcoal py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-8 md:grid-cols-3">
          {achievementKeys.map((key, index) => {
            const Icon = achievementIcons[index];
            return (
              <motion.div
                className="text-center"
                initial={{ opacity: 0, y: 40 }}
                key={key}
                onAnimationComplete={
                  index === achievementKeys.length - 1 ? enable : undefined
                }
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileInView={{ opacity: 1, y: 0 }}
              >
                <Icon className="mx-auto mb-4 h-8 w-8 text-cream" />
                <Field
                  as="h3"
                  className="mb-2 font-light text-2xl text-cream"
                  name={`${key}.title`}
                />
                <Field
                  as="p"
                  className="text-muted-foreground"
                  name={`${key}.description`}
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function generateId() {
  return Math.random().toString(36).slice(2, 8);
}

function useTimelineEntries() {
  const section = "essence.timeline";
  const { data } = useSection();
  const { write, deleteField, isFieldDeleted, sectionChanges } =
    useDraftBufferOps();
  const resetSignal = useDraftBufferReset();
  const newIdsRef = useRef(new Set<string>());

  const derive = useCallback(
    () =>
      deriveBufferedEntries(data, sectionChanges(section), (prefix) =>
        isFieldDeleted(section, prefix)
      ),
    [data, sectionChanges, isFieldDeleted]
  );

  const [entries, setEntries] = useState(() => derive());
  const prevDataRef = useRef(data);
  const prevResetRef = useRef(resetSignal);

  if (data !== prevDataRef.current || resetSignal !== prevResetRef.current) {
    if (resetSignal !== prevResetRef.current) {
      newIdsRef.current = new Set();
    }
    prevDataRef.current = data;
    prevResetRef.current = resetSignal;
    setEntries(derive());
  }

  const handleAdd = useCallback(() => {
    const id = generateId();
    const year = new Date().getFullYear().toString();
    for (const w of createEntryWrites(id, year)) {
      write(section, w.field, w.locale, w.value);
    }
    newIdsRef.current.add(id);
    setEntries((prev) => [...prev, { id }]);
  }, [write]);

  const handleDelete = useCallback(
    (id: string) => {
      deleteField(section, id);
      newIdsRef.current.delete(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    },
    [deleteField]
  );

  return { entries, handleAdd, handleDelete, newIds: newIdsRef.current };
}

function EssenceTimeline() {
  const { enable } = useChromeEnabler();
  const { isEditMode } = useEditMode();
  const { entries, handleAdd, handleDelete, newIds } = useTimelineEntries();

  return (
    <section className="bg-charcoal py-24">
      <div className="mx-auto max-w-4xl px-6">
        <motion.div
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          onAnimationComplete={enable}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <Field
            as="p"
            className="mb-4 text-cream/60 text-sm uppercase tracking-widest"
            name="label"
          />
          <Field as="h2" className="text-cream" name="title" />
        </motion.div>

        <div className="relative">
          <div className="absolute top-0 bottom-0 left-[7px] w-px bg-border md:left-1/2 md:-translate-x-px" />

          {entries.map(({ id }, index) => (
            <ChromeEnablerProvider key={id}>
              <TimelineEntryInner
                id={id}
                index={index}
                isNew={newIds.has(id)}
                onDelete={handleDelete}
              />
            </ChromeEnablerProvider>
          ))}

          <AnimatePresence>
            {isEditMode && (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className="h-0 overflow-visible"
                exit={{ opacity: 0, y: -4 }}
                initial={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mt-8 text-center">
                  <button
                    className="inline-flex items-center gap-2 rounded border border-cream/20 px-4 py-2 text-cream/60 text-sm transition-colors hover:border-cream/40 hover:text-cream"
                    onClick={handleAdd}
                    type="button"
                  >
                    <Plus className="h-4 w-4" />
                    Add Timeline Entry
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

function TimelineEntryInner({
  id,
  index,
  isNew,
  onDelete,
}: {
  id: string;
  index: number;
  isNew: boolean;
  onDelete: (id: string) => void;
}) {
  const { isEditMode } = useEditMode();
  const { enable } = useChromeEnabler();

  const animateProps = isNew
    ? { animate: { opacity: 1, x: 0 } }
    : { whileInView: { opacity: 1, x: 0 }, viewport: { once: true } };

  return (
    <motion.div
      className={`relative mb-12 pl-10 md:mb-16 md:w-1/2 md:pl-0 ${
        index % 2 === 0 ? "md:pr-12 md:text-right" : "md:ml-auto md:pl-12"
      }`}
      initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
      onAnimationComplete={enable}
      transition={{ duration: 0.5 }}
      {...animateProps}
    >
      <div
        className={`absolute top-1 left-0 h-4 w-4 rounded-full border-2 border-cream bg-charcoal ${
          index % 2 === 0 ? "md:right-[-8px] md:left-auto" : "md:left-[-8px]"
        }`}
      />

      <div className="flex flex-col gap-2">
        <Field
          as="span"
          className="block text-cream/60 text-sm uppercase tracking-widest"
          name={`${id}.year`}
        />
        <Field
          as="h3"
          className="font-light text-cream text-xl"
          name={`${id}.title`}
        />
        <Field
          as="p"
          className="text-muted-foreground"
          multiline
          name={`${id}.description`}
        />
      </div>
      <AnimatePresence>
        {isEditMode && (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="h-0 overflow-visible"
            exit={{ opacity: 0, y: -4 }}
            initial={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            <button
              className="mt-2 inline-flex items-center gap-1 rounded border border-red-500/30 px-2 py-1 text-red-400 text-xs transition-colors hover:bg-red-500/10"
              onClick={() => onDelete(id)}
              type="button"
            >
              <Trash2 className="h-3 w-3" />
              Remove
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function EssenceCTA() {
  const { enable } = useChromeEnabler();
  const ctaRef = useRef<HTMLAnchorElement>(null);

  return (
    <section className="py-24">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <Field as="h2" className="mb-6 text-foreground" name="title" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.1 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <Field
            as="p"
            className="mb-10 text-lg text-muted-foreground"
            multiline
            name="description"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          onAnimationComplete={enable}
          transition={{ delay: 0.2 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <Link
            className="group inline-flex items-center gap-2 rounded-full border border-primary bg-primary px-8 py-4 font-medium text-primary-foreground text-sm uppercase tracking-widest transition-all hover:bg-transparent hover:text-foreground"
            href="/connect"
            ref={ctaRef}
          >
            <Field as="span" containerRef={ctaRef} name="button" />
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
