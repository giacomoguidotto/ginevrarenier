"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ExperienceToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const t = useTranslations("common.theme");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-7 w-[140px] items-center justify-center">
        <div className="h-4 w-20 animate-pulse rounded-full bg-cream/10" />
      </div>
    );
  }

  const isDark = resolvedTheme === "dark";

  const handleToggle = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <button
      aria-label={isDark ? t("switchToLight") : t("switchToDark")}
      className="group relative flex h-7 items-center gap-2 rounded-full border border-cream/20 bg-cream/5 px-2.5 transition-all duration-300 hover:border-cream/40 hover:bg-cream/10"
      onClick={handleToggle}
      type="button"
    >
      {/* Icon container with morph animation */}
      <div className="relative h-4 w-4">
        <AnimatePresence initial={false} mode="wait">
          {isDark ? (
            <motion.div
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              className="absolute inset-0"
              exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
              initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
              key="moon"
              transition={{ duration: 0.2 }}
            >
              <Moon className="h-4 w-4 text-cream" />
            </motion.div>
          ) : (
            <motion.div
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              className="absolute inset-0"
              exit={{ opacity: 0, rotate: -90, scale: 0.5 }}
              initial={{ opacity: 0, rotate: 90, scale: 0.5 }}
              key="sun"
              transition={{ duration: 0.2 }}
            >
              <Sun className="h-4 w-4 text-cream" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Text label with slide animation */}
      <div className="relative h-4 overflow-hidden">
        <AnimatePresence initial={false} mode="wait">
          <motion.span
            animate={{ y: 0, opacity: 1 }}
            className="block whitespace-nowrap text-[10px] text-cream/60 uppercase tracking-widest"
            exit={{ y: -12, opacity: 0 }}
            initial={{ y: 12, opacity: 0 }}
            key={isDark ? "dark" : "light"}
            transition={{ duration: 0.2 }}
          >
            {isDark ? t("dark") : t("light")}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Subtle glow effect on hover */}
      <motion.div
        animate={{
          opacity: isDark ? 0.15 : 0.1,
        }}
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 20% 50%, oklch(0.95 0.02 85 / 0.3), transparent 70%)",
        }}
        transition={{ duration: 0.3 }}
      />
    </button>
  );
}
