"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Award, Camera, Globe } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRef } from "react";
import { PageTransition } from "@/components/layout/page-transition";
import { Link } from "@/i18n/routing";

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

  const t = useTranslations("essence");

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
              <motion.p
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 text-cream/60 text-sm uppercase tracking-widest"
                initial={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                {t("hero.label")}
              </motion.p>
              <motion.h1
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 text-cream"
                initial={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                {t("hero.title")}
              </motion.h1>
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 text-lg text-muted-foreground"
                initial={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <p>{t("hero.paragraph1")}</p>
                <p>{t("hero.paragraph2")}</p>
                <p>{t("hero.paragraph3")}</p>
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
                  <h3 className="mb-2 font-light text-2xl text-cream">
                    {t(`achievements.${key}.title`)}
                  </h3>
                  <p className="text-muted-foreground">
                    {t(`achievements.${key}.description`)}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Philosophy */}
      <section className="py-24">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <motion.p
            className="mb-4 text-cream/60 text-sm uppercase tracking-widest"
            initial={{ opacity: 0, y: 20 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            {t("philosophy.label")}
          </motion.p>
          <motion.blockquote
            className="font-light text-3xl text-cream leading-relaxed md:text-4xl"
            initial={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.1 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            "{t("philosophy.quote")}"
          </motion.blockquote>
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
            <p className="mb-4 text-cream/60 text-sm uppercase tracking-widest">
              {t("timeline.label")}
            </p>
            <h2 className="text-cream">{t("timeline.title")}</h2>
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
                <h3 className="mb-2 font-light text-cream text-xl">
                  {t(`timeline.${year}.title`)}
                </h3>
                <p className="text-muted-foreground">
                  {t(`timeline.${year}.description`)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <motion.h2
            className="mb-6 text-cream"
            initial={{ opacity: 0, y: 20 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            {t("cta.title")}
          </motion.h2>
          <motion.p
            className="mb-10 text-lg text-muted-foreground"
            initial={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.1 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            {t("cta.description")}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.2 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <Link
              className="group inline-flex items-center gap-2 rounded-full border border-cream bg-cream px-8 py-4 font-medium text-background text-sm uppercase tracking-widest transition-all hover:bg-transparent hover:text-cream"
              href="/connect"
            >
              <span>{t("cta.button")}</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>
      </section>
    </PageTransition>
  );
}
