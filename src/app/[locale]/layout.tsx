import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { EditFab } from "@/components/admin/edit-fab";
import { EditModeProvider } from "@/components/admin/edit-mode-context";
import { EditOverlay } from "@/components/admin/edit-overlay";
import { EditToolbarWrapper } from "@/components/admin/edit-toolbar-wrapper";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { ConvexClientProvider } from "@/components/providers/convex-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { type Locale, locales } from "@/i18n/config";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

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
    en: "Ginevra Renier | Photography",
    it: "Ginevra Renier | Fotografia",
  };

  const descriptions: Record<Locale, string> = {
    en: "Capturing moments that transcend time. Photography portfolio of Ginevra Renier - portraits, landscapes, and visual storytelling.",
    it: "Catturare momenti che trascendono il tempo. Portfolio fotografico di Ginevra Renier - ritratti, paesaggi e narrazione visiva.",
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
    ],
    authors: [{ name: "Giacomo Guidotto" }],
    creator: "Giacomo Guidotto",
    alternates: {
      canonical: `${baseUrl}/${locale}`,
      languages: {
        en: `${baseUrl}/en`,
        it: `${baseUrl}/it`,
      },
    },
    openGraph: {
      type: "website",
      locale: locale === "it" ? "it_IT" : "en_US",
      alternateLocale: locale === "it" ? "en_US" : "it_IT",
      siteName: "Ginevra Renier Photography",
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

  const messages = await getMessages();

  return (
    <ConvexClientProvider>
      <ThemeProvider>
        <NextIntlClientProvider messages={messages}>
          <EditModeProvider>
            <EditOverlay />
            <Navbar />
            <main className="min-h-screen">{children}</main>
            <Footer />
            <EditFab />
            <EditToolbarWrapper />
          </EditModeProvider>
        </NextIntlClientProvider>
      </ThemeProvider>
    </ConvexClientProvider>
  );
}
