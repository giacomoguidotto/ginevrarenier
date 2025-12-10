"use client";

import { motion } from "framer-motion";
import { Instagram, Mail, Twitter } from "lucide-react";
import Link from "next/link";

const socialLinks = [
  {
    href: "https://instagram.com/ginevrarenier",
    label: "Instagram",
    icon: Instagram,
  },
  {
    href: "https://twitter.com/ginevrarenier",
    label: "Twitter",
    icon: Twitter,
  },
  {
    href: "mailto:hello@ginevrarenier.com",
    label: "Email",
    icon: Mail,
  },
];

const footerLinks = [
  { href: "/vision", label: "Vision" },
  { href: "/reflections", label: "Reflections" },
  { href: "/essence", label: "Essence" },
  { href: "/connect", label: "Connect" },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-border border-t bg-charcoal">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-3">
          {/* Brand */}
          <div className="space-y-4">
            <Link className="block" href="/">
              <span className="font-light text-xl uppercase tracking-widest">
                Ginevra Renier
              </span>
            </Link>
            <p className="max-w-xs text-muted-foreground text-sm">
              Capturing moments that transcend time. Photography that tells
              stories through light and shadow.
            </p>
          </div>

          {/* Navigation */}
          <div className="space-y-4">
            <h3 className="font-medium text-muted-foreground text-sm uppercase tracking-widest">
              Explore
            </h3>
            <nav className="flex flex-col gap-3">
              {footerLinks.map((link) => (
                <Link
                  className="text-foreground/80 text-sm transition-colors hover:text-cream"
                  href={link.href}
                  key={link.href}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Social */}
          <div className="space-y-4">
            <h3 className="font-medium text-muted-foreground text-sm uppercase tracking-widest">
              Connect
            </h3>
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <motion.a
                  aria-label={social.label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-border transition-colors hover:border-cream hover:text-cream"
                  href={social.href}
                  key={social.href}
                  rel="noopener noreferrer"
                  target="_blank"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <social.icon className="h-4 w-4" />
                </motion.a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-border border-t pt-8 md:flex-row">
          <p className="text-muted-foreground text-xs">
            © {currentYear} Ginevra Renier. All rights reserved.
          </p>
          <p className="text-muted-foreground text-xs">
            Crafted with passion and light
          </p>
        </div>
      </div>
    </footer>
  );
}
