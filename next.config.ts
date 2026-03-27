import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  reactCompiler: true,

  // Image optimization configuration
  images: {
    // Enable modern image formats
    formats: ["image/avif", "image/webp"],

    // Cloudinary remote images
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],

    // Device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],

    // Image sizes for the srcset
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],

    // Minimize layout shift with size hints
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Experimental features
  experimental: {
    // Optimize package imports
    optimizePackageImports: ["framer-motion", "lucide-react"],
  },
};

export default withNextIntl(nextConfig);
