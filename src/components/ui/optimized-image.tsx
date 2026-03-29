"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

type OptimizedImageProps = Omit<ImageProps, "onLoad"> & {
  aspectRatio?: number;
};

// Simple blur placeholder as base64 data URI
const blurDataURL =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0IDMiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiMxYTFhMWEiLz48L3N2Zz4=";

export function OptimizedImage({
  className,
  aspectRatio,
  alt,
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div
      className={cn("overflow-hidden", className)}
      style={aspectRatio === undefined ? {} : { aspectRatio }}
    >
      <Image
        {...props}
        alt={alt}
        blurDataURL={blurDataURL}
        className={cn(
          "h-full w-full object-cover transition-opacity duration-500",
          isLoaded ? "opacity-100" : "opacity-0"
        )}
        onLoad={() => setIsLoaded(true)}
        placeholder="blur"
      />
    </div>
  );
}
