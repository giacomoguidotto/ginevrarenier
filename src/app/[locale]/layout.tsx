import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { api } from "convex/_generated/api";
import { fetchQuery } from "convex/nextjs";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { DraftBufferProvider } from "@/components/admin/draft-buffer-context";
import { EditFab } from "@/components/admin/edit-fab";
import { EditModeProvider } from "@/components/admin/edit-mode-context";
import { EditToolbarWrapper } from "@/components/admin/edit-toolbar-wrapper";
import { UnsavedChangesGuard } from "@/components/admin/unsaved-changes-guard";
import { Footer } from "@/components/layout/footer";
import { LocaleToast } from "@/components/layout/locale-toast";
import { Navbar } from "@/components/layout/navbar";
import { ConvexClientProvider } from "@/components/providers/convex-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { type Locale, localePath, locales } from "@/i18n/config";
import { PersonJsonLd, socialLinkToUrl, WebSiteJsonLd } from "@/lib/seo";

interface Props {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const titles: Record<Locale, string> = {
    en: "Ginevra Renier",
    it: "Ginevra Renier",
  };

  const footerContent = await fetchQuery(api.siteContent.getBySection, {
    section: "footer",
  });
  const tagline = footerContent?.content?.tagline;

  const defaultDescriptions: Record<Locale, string> = {
    en: "Capturing moments that transcend time. Photography portfolio of Ginevra Renier - portraits, landscapes, and visual storytelling.",
    it: "Catturare momenti che trascendono il tempo. Portfolio fotografico di Ginevra Renier - ritratti, paesaggi e narrazione visiva.",
  };

  const descriptions: Record<Locale, string> = {
    en: tagline?.en || defaultDescriptions.en,
    it: tagline?.it || defaultDescriptions.it,
  };

  function getLocaleValue<T extends Record<Locale, string>>(
    obj: T,
    loc: Locale | string
  ): string {
    return obj[(loc in obj ? loc : "en") as Locale];
  }

  function getTitle(loc: Locale | string): string {
    return getLocaleValue(titles, loc);
  }

  function getDescription(loc: Locale | string): string {
    return getLocaleValue(descriptions, loc);
  }

  const baseUrl = "https://ginevrarenier.com";

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: getTitle(locale),
      template: "%s | Ginevra Renier",
    },
    description: getDescription(locale),
    keywords: [
      "photography",
      "photographer",
      "portrait",
      "landscape",
      "fine art",
      "Ginevra Renier",
      "Ginevra Renier",
    ],
    authors: [{ name: "Ginevra Renier" }],
    creator: "Ginevra Renier",
    alternates: {
      canonical: `${baseUrl}${localePath(locale)}`,
      languages: Object.fromEntries(
        locales.map((l) => [l, `${baseUrl}${localePath(l)}`] as const)
      ),
    },
    openGraph: {
      type: "website",
      locale: locale === "it" ? "it_IT" : "en_US",
      alternateLocale: locale === "it" ? "en_US" : "it_IT",
      siteName: "Ginevra Renier",
      title: getTitle(locale),
      description: getDescription(locale),
    },
    twitter: {
      card: "summary_large_image",
      title: getTitle(locale),
      description: getDescription(locale),
      creator: "@ginevrarenier",
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const [messages, socialLinks] = await Promise.all([
    getMessages(),
    fetchQuery(api.socialLinks.list, {}),
  ]);

  const socialUrls = socialLinks
    .map((link) => socialLinkToUrl(link.platform, link.handle ?? undefined))
    .filter((url): url is string => url !== null && !url.startsWith("mailto:"));

  return (
    <ConvexClientProvider>
      <ThemeProvider>
        <NextIntlClientProvider messages={messages}>
          <TooltipProvider>
            <EditModeProvider>
              <DraftBufferProvider>
                <WebSiteJsonLd locale={locale as Locale} />
                <PersonJsonLd
                  locale={locale as Locale}
                  socialUrls={socialUrls}
                />
                <div className="flex min-h-screen flex-col">
                  <Navbar />
                  <main className="flex-1">{children}</main>
                  <Footer />
                </div>
                <LocaleToast />
                <Analytics />
                <SpeedInsights />
                <UnsavedChangesGuard>
                  <EditFab />
                  <EditToolbarWrapper />
                </UnsavedChangesGuard>
              </DraftBufferProvider>
            </EditModeProvider>
          </TooltipProvider>
        </NextIntlClientProvider>
      </ThemeProvider>
    </ConvexClientProvider>
  );
}
