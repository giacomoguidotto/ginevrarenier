import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Ginevra Renier | Photography",
    template: "%s | Ginevra Renier",
  },
  description:
    "Capturing moments that transcend time. Photography portfolio of Ginevra Renier - portraits, landscapes, and visual storytelling.",
  keywords: [
    "photography",
    "photographer",
    "portrait",
    "landscape",
    "fine art",
    "Ginevra Renier",
  ],
  authors: [{ name: "Ginevra Renier" }],
  creator: "Ginevra Renier",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Ginevra Renier Photography",
    title: "Ginevra Renier | Photography",
    description:
      "Capturing moments that transcend time. Photography portfolio of Ginevra Renier.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ginevra Renier | Photography",
    description:
      "Capturing moments that transcend time. Photography portfolio of Ginevra Renier.",
    creator: "@ginevrarenier",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
