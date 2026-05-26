"use client";

import { api } from "convex/_generated/api";
import { useQuery } from "convex/react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useRef, useState } from "react";
import {
  useDraftBufferOps,
  useEditVersion,
} from "@/components/admin/draft-buffer-context";
import { useEditMode } from "@/components/admin/edit-mode-context";
import { usePageRegistry } from "@/components/admin/page-boundary";
import { pageHasStaleFields } from "@/components/admin/staleness-queries";
import { useStaleFields } from "@/components/admin/use-stale-fields";
import { SemanticDot } from "@/components/ui/semantic-dot";
import type { Locale } from "@/i18n/config";
import { Link, usePathname } from "@/i18n/routing";

const navLinkKeys = [
  { href: "/", key: "home" },
  { href: "/vision", key: "vision" },
  { href: "/reflections", key: "reflections" },
  { href: "/essence", key: "essence" },
  { href: "/connect", key: "connect" },
] as const;

const navSectionMap: Partial<
  Record<(typeof navLinkKeys)[number]["key"], string>
> = {
  vision: "vision.header",
  reflections: "reflections.header",
  essence: "essence.hero",
  connect: "connect.header",
};

function useNavLabel(key: string, fallback: string): string {
  const sectionName = navSectionMap[key as keyof typeof navSectionMap];
  const pageLocale = useLocale() as Locale;
  const { isEditMode, editingLocale } = useEditMode();
  const { read } = useDraftBufferOps();
  useEditVersion();

  const sectionData = useQuery(
    api.siteContent.getBySection,
    sectionName ? { section: sectionName } : "skip"
  );

  if (!sectionName) {
    return fallback;
  }

  const locale = isEditMode ? editingLocale : pageLocale;
  const draftValue = read(sectionName, "title", locale);
  const convexValue = sectionData?.content?.title?.[locale];

  return draftValue ?? convexValue ?? fallback;
}

function MagneticLink({
  href,
  label,
  isActive,
  children,
}: {
  href: "/" | "/vision" | "/reflections" | "/essence" | "/connect";
  label: string;
  isActive: boolean;
  children?: React.ReactNode;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { stiffness: 350, damping: 15 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) {
      return;
    }
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distanceX = e.clientX - centerX;
    const distanceY = e.clientY - centerY;
    x.set(distanceX * 0.3);
    y.set(distanceY * 0.3);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div style={{ x: springX, y: springY }}>
      <Link
        className="relative flex items-center gap-1 px-4 py-2 text-sm uppercase tracking-widest transition-colors hover:text-foreground"
        href={href}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
        ref={ref}
      >
        <span
          className={isActive ? "text-foreground" : "text-muted-foreground"}
        >
          {label}
        </span>
        {children}
        {isActive ? (
          <motion.div
            className="absolute right-4 bottom-0 left-4 h-px bg-foreground"
            layoutId="navbar-indicator"
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
          />
        ) : null}
      </Link>
    </motion.div>
  );
}

function NavStaleDot({
  pageKey,
  staleFields,
}: {
  pageKey: string;
  staleFields: { section: string; field: string; locale: string }[];
}) {
  const { editingLocale } = useEditMode();
  const sections = usePageRegistry(pageKey);
  if (!pageHasStaleFields(staleFields, sections, editingLocale)) {
    return null;
  }
  return <SemanticDot label={`${pageKey} has stale fields`} state="warning" />;
}

function DesktopNavItem({
  link,
  isActive,
  fallback,
  staleFields,
}: {
  link: (typeof navLinkKeys)[number];
  isActive: boolean;
  fallback: string;
  staleFields: { section: string; field: string; locale: string }[];
}) {
  const label = useNavLabel(link.key, fallback);
  return (
    <MagneticLink href={link.href} isActive={isActive} label={label}>
      <AnimatePresence>
        <NavStaleDot pageKey={link.key} staleFields={staleFields} />
      </AnimatePresence>
    </MagneticLink>
  );
}

function MobileNavItem({
  link,
  isActive,
  fallback,
  index,
  isMenuOpen,
  onClose,
  staleFields,
}: {
  link: (typeof navLinkKeys)[number];
  isActive: boolean;
  fallback: string;
  index: number;
  isMenuOpen: boolean;
  onClose: () => void;
  staleFields: { section: string; field: string; locale: string }[];
}) {
  const label = useNavLabel(link.key, fallback);
  return (
    <motion.div
      animate={{
        opacity: isMenuOpen ? 1 : 0,
        y: isMenuOpen ? 0 : 20,
      }}
      initial={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <Link
        className={`inline-flex items-center gap-2 font-light text-3xl uppercase tracking-widest ${
          isActive ? "text-foreground" : "text-muted-foreground"
        }`}
        href={link.href}
        onClick={onClose}
      >
        {label}
        <AnimatePresence>
          <NavStaleDot pageKey={link.key} staleFields={staleFields} />
        </AnimatePresence>
      </Link>
    </motion.div>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { scrollY } = useScroll();
  const navBackground = useTransform(scrollY, [0, 100], [0, 1]);
  const staleFields = useStaleFields();

  const t = useTranslations("common.nav");

  return (
    <>
      <motion.header
        animate={{ y: 0 }}
        className="fixed top-0 right-0 left-0 z-50"
        initial={{ y: -100 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div
          className="absolute inset-0 border-border border-b bg-background/80 backdrop-blur-xl"
          style={{ opacity: navBackground }}
        />
        <nav className="relative mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          {/* Logo */}
          <Link
            className="group relative z-10 flex items-center gap-3"
            href="/"
          >
            <motion.div
              className="flex items-center gap-3"
              transition={{ duration: 0.3 }}
              whileHover={{ scale: 1.02 }}
            >
              <Image
                alt=""
                className="block h-8 w-auto dark:hidden"
                height={32}
                priority
                src="/images/logo-light.svg"
                width={33}
              />
              <Image
                alt=""
                className="hidden h-8 w-auto dark:block"
                height={32}
                priority
                src="/images/logo-dark.svg"
                width={33}
              />
              <span className="font-light text-xl uppercase tracking-widest">
                Ginevra Renier
              </span>
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-2 md:flex">
            {navLinkKeys.map((link) => (
              <DesktopNavItem
                fallback={t(link.key)}
                isActive={pathname === link.href}
                key={link.href}
                link={link}
                staleFields={staleFields}
              />
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            aria-label="Toggle menu"
            className="relative z-10 flex h-10 w-10 items-center justify-center md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            type="button"
          >
            <div className="flex flex-col gap-1.5">
              <motion.span
                animate={{
                  rotate: isMenuOpen ? 45 : 0,
                  y: isMenuOpen ? 7 : 0,
                }}
                className="block h-px w-6 bg-foreground"
              />
              <motion.span
                animate={{
                  opacity: isMenuOpen ? 0 : 1,
                }}
                className="block h-px w-6 bg-foreground"
              />
              <motion.span
                animate={{
                  rotate: isMenuOpen ? -45 : 0,
                  y: isMenuOpen ? -7 : 0,
                }}
                className="block h-px w-6 bg-foreground"
              />
            </div>
          </button>
        </nav>
      </motion.header>

      {/* Mobile Menu */}
      <motion.div
        animate={{
          opacity: isMenuOpen ? 1 : 0,
          pointerEvents: isMenuOpen ? "auto" : "none",
        }}
        className="fixed inset-0 z-40 bg-background md:hidden"
        initial={false}
        transition={{ duration: 0.3 }}
      >
        <nav className="flex h-full flex-col items-center justify-center gap-8">
          {navLinkKeys.map((link, index) => (
            <MobileNavItem
              fallback={t(link.key)}
              index={index}
              isActive={pathname === link.href}
              isMenuOpen={isMenuOpen}
              key={link.href}
              link={link}
              onClose={() => setIsMenuOpen(false)}
              staleFields={staleFields}
            />
          ))}
        </nav>
      </motion.div>
    </>
  );
}
