"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Award, Camera, Globe } from "lucide-react";
import Image from "next/image";
import { useRef } from "react";
import { EditableText } from "@/components/admin/editable-text";
import { PageTransition } from "@/components/layout/page-transition";
import { Link } from "@/i18n/routing";
import { useEditableSiteContent } from "@/lib/use-editable-content";

const achievementIcons = [Camera, Award, Globe];
const achievementKeys = ["years", "recognition", "countries"] as const;

const timelineYears = ["2022", "2024", "2025"] as const;

export function EssenceClient() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const imageY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, 50]);

  const hero = useEditableSiteContent("essence.hero");
  const ach = useEditableSiteContent("essence.achievements");
  const tl = useEditableSiteContent("essence.timeline");
  const ctaSec = useEditableSiteContent("essence.cta");

  return (
    <PageTransition>
      {/* Hero Section */}
      <section
        className="relative min-h-screen overflow-hidden pt-32 pb-20 lg:pb-0"
        ref={heroRef}
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
            {/* Image */}
            <motion.div
              animate={{ opacity: 1, x: 0 }}
              className="relative aspect-3/4 overflow-hidden rounded-lg lg:aspect-auto lg:h-[80vh]"
              initial={{ opacity: 0, x: -50 }}
              style={{ y: imageY }}
              transition={{ duration: 0.8 }}
            >
              <Image
                alt="Ginevra Renier"
                className="object-cover"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                src="/images/hero/artist-portrait.jpg"
              />
            </motion.div>

            {/* Text Content */}
            <motion.div
              className="flex flex-col justify-center lg:py-20"
              style={{ y: textY }}
            >
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <EditableText
                  as="p"
                  className="mb-4 text-foreground/60 text-sm uppercase tracking-widest"
                  onChange={(v) => hero.set("label", v)}
                  value={hero.get("label")}
                />
              </motion.div>
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <EditableText
                  as="h1"
                  className="mb-8 text-foreground"
                  onChange={(v) => hero.set("title", v)}
                  value={hero.get("title")}
                />
              </motion.div>
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 text-lg text-muted-foreground"
                initial={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <EditableText
                  as="p"
                  multiline
                  onChange={(v) => hero.set("paragraph1", v)}
                  value={hero.get("paragraph1")}
                />
                <EditableText
                  as="p"
                  multiline
                  onChange={(v) => hero.set("paragraph2", v)}
                  value={hero.get("paragraph2")}
                />
                <EditableText
                  as="p"
                  multiline
                  onChange={(v) => hero.set("paragraph3", v)}
                  value={hero.get("paragraph3")}
                />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Achievements */}
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
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileInView={{ opacity: 1, y: 0 }}
                >
                  <Icon className="mx-auto mb-4 h-8 w-8 text-cream" />
                  <EditableText
                    as="h3"
                    className="mb-2 font-light text-2xl text-cream"
                    onChange={(v) => ach.set(`${key}.title`, v)}
                    value={ach.get(`${key}.title`)}
                  />
                  <EditableText
                    as="p"
                    className="text-muted-foreground"
                    onChange={(v) => ach.set(`${key}.description`, v)}
                    value={ach.get(`${key}.description`)}
                  />
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="bg-charcoal py-24">
        <div className="mx-auto max-w-4xl px-6">
          <motion.div
            className="mb-16 text-center"
            initial={{ opacity: 0, y: 20 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <EditableText
              as="p"
              className="mb-4 text-cream/60 text-sm uppercase tracking-widest"
              onChange={(v) => tl.set("label", v)}
              value={tl.get("label")}
            />
            <EditableText
              as="h2"
              className="text-cream"
              onChange={(v) => tl.set("title", v)}
              value={tl.get("title")}
            />
          </motion.div>

          <div className="relative">
            {/* Timeline line */}
            <div className="md:-translate-x-px absolute top-0 bottom-0 left-[7px] w-px bg-border md:left-1/2" />

            {timelineYears.map((year, index) => (
              <motion.div
                className={`relative mb-12 pl-10 md:mb-16 md:w-1/2 md:pl-0 ${
                  index % 2 === 0
                    ? "md:pr-12 md:text-right"
                    : "md:ml-auto md:pl-12"
                }`}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                key={year}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                whileInView={{ opacity: 1, x: 0 }}
              >
                {/* Timeline dot */}
                <div
                  className={`absolute top-1 left-0 h-4 w-4 rounded-full border-2 border-cream bg-charcoal ${
                    index % 2 === 0
                      ? "md:right-[-8px] md:left-auto"
                      : "md:left-[-8px]"
                  }`}
                />

                <span className="mb-2 block text-cream/60 text-sm uppercase tracking-widest">
                  {year}
                </span>
                <EditableText
                  as="h3"
                  className="mb-2 font-light text-cream text-xl"
                  onChange={(v) => tl.set(`${year}.title`, v)}
                  value={tl.get(`${year}.title`)}
                />
                <EditableText
                  as="p"
                  className="text-muted-foreground"
                  multiline
                  onChange={(v) => tl.set(`${year}.description`, v)}
                  value={tl.get(`${year}.description`)}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <EditableText
              as="h2"
              className="mb-6 text-foreground"
              onChange={(v) => ctaSec.set("title", v)}
              value={ctaSec.get("title")}
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.1 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <EditableText
              as="p"
              className="mb-10 text-lg text-muted-foreground"
              multiline
              onChange={(v) => ctaSec.set("description", v)}
              value={ctaSec.get("description")}
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.2 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <Link
              className="group inline-flex items-center gap-2 rounded-full border border-primary bg-primary px-8 py-4 font-medium text-primary-foreground text-sm uppercase tracking-widest transition-all hover:bg-transparent hover:text-foreground"
              href="/connect"
            >
              <EditableText
                as="span"
                onChange={(v) => ctaSec.set("button", v)}
                value={ctaSec.get("button")}
              />
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>
      </section>
    </PageTransition>
  );
}
