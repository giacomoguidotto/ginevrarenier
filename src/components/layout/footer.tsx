"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Field } from "@/components/admin/field";
import { Section } from "@/components/admin/section";
import { Link } from "@/i18n/routing";
import { useSocialLinks } from "@/lib/hooks";
import { getHref, getIcon, getLabel } from "@/lib/platform-registry";
import { ExperienceToggle } from "./experience-toggle";
import { LanguageSwitcher } from "./language-switcher";

const footerLinkKeys = [
  { href: "/vision", key: "vision" },
  { href: "/reflections", key: "reflections" },
  { href: "/essence", key: "essence" },
  { href: "/connect", key: "connect" },
] as const;

export function Footer() {
  const currentYear = new Date().getFullYear();
  const t = useTranslations("common");
  const { links } = useSocialLinks();
  const socials = [...links].sort((a, b) => {
    const aIsContact = a.platform === "email" ? 0 : 1;
    const bIsContact = b.platform === "email" ? 0 : 1;
    return aIsContact - bIsContact || a.order - b.order;
  });

  return (
    <footer className="border-cream/10 border-t bg-charcoal text-cream">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-3">
          {/* Brand */}
          <Section label="Footer" name="footer">
            <div className="space-y-4">
              <Link className="block" href="/">
                <span className="font-light text-xl uppercase tracking-widest">
                  Ginevra Renier
                </span>
              </Link>
              <Field
                as="p"
                className="max-w-xs text-cream/60 text-sm"
                name="tagline"
              />
            </div>
          </Section>

          {/* Navigation */}
          <div className="space-y-4">
            <h3 className="font-medium text-cream/50 text-sm uppercase tracking-widest">
              {t("footer.explore")}
            </h3>
            <nav className="flex flex-col gap-3">
              {footerLinkKeys.map((link) => (
                <Link
                  className="text-cream/80 text-sm transition-colors hover:text-cream"
                  href={link.href}
                  key={link.href}
                >
                  {t(`nav.${link.key}`)}
                </Link>
              ))}
            </nav>
          </div>

          {/* Social */}
          <div className="space-y-4">
            <h3 className="font-medium text-cream/50 text-sm uppercase tracking-widest">
              {t("footer.connect")}
            </h3>
            <div className="flex gap-4">
              {socials.map((social) => {
                const Icon = getIcon(social.platform);
                const href = getHref(social.platform, social.handle ?? "");
                return (
                  <motion.a
                    aria-label={getLabel(social.platform)}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-cream/20 text-cream/80 transition-colors hover:border-cream hover:text-cream"
                    href={href}
                    key={social._id}
                    rel="noopener noreferrer"
                    target="_blank"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Icon className="h-4 w-4" />
                  </motion.a>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-cream/10 border-t pt-8 md:flex-row">
          <p className="text-cream/50 text-xs">
            {t("footer.copyright", { year: currentYear })}
          </p>
          <div className="flex items-center gap-4 md:gap-6">
            <ExperienceToggle />
            <span className="text-cream/20">|</span>
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </footer>
  );
}
