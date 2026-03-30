"use client";

import { Camera } from "lucide-react";
import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import { useEditMode } from "./edit-mode-context";
import { uploadImage } from "./image-upload";
import { usePageChanges } from "./page-changes-context";

interface EditableImageProps {
  alt: string;
  className?: string;
  fill?: boolean;
  folder: string;
  onUpload: (url: string, publicId: string) => void;
  priority?: boolean;
  sizes?: string;
  src: string | undefined;
}

/**
 * Image that shows an upload overlay in edit mode.
 * Click to upload a new image via Cloudinary.
 */
export function EditableImage({
  src,
  alt,
  onUpload,
  folder,
  fill = true,
  sizes,
  className = "object-cover",
  priority = false,
}: EditableImageProps) {
  const { isEditMode } = useEditMode();
  const { trackUploadedAsset } = usePageChanges();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(
    async (file: File) => {
      setUploading(true);
      const result = await uploadImage(file, folder);
      trackUploadedAsset(result.publicId);
      onUpload(result.url, result.publicId);
      setUploading(false);
    },
    [folder, onUpload, trackUploadedAsset]
  );

  return (
    <>
      {src ? (
        <Image
          alt={alt}
          className={className}
          fill={fill}
          priority={priority}
          sizes={sizes}
          src={src}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-foreground/5">
          <Camera className="h-8 w-8 text-foreground/20" />
        </div>
      )}

      {isEditMode ? (
        <>
          <button
            className={`absolute inset-0 z-10 flex cursor-pointer items-center justify-center transition-all ${uploading ? "bg-background/40 opacity-100" : "bg-background/0 opacity-0 hover:bg-background/40 hover:opacity-100"}`}
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            {uploading ? (
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground/60" />
            ) : (
              <div className="flex items-center gap-2 rounded-full bg-background/70 px-4 py-2 text-foreground text-sm backdrop-blur-sm">
                <Camera className="h-4 w-4" />
                Change image
              </div>
            )}
          </button>
          <input
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleUpload(file);
              }
            }}
            ref={fileInputRef}
            type="file"
          />
        </>
      ) : null}
    </>
  );
}
