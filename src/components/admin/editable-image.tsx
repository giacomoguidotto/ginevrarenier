"use client";

import { Camera, Trash2 } from "lucide-react";
import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useImageAssets } from "./draft-buffer-context";
import { useEditMode } from "./edit-mode-context";

interface EditableImageProps {
  alt: string;
  className?: string;
  deleteLabel?: string;
  fill?: boolean;
  folder: string;
  onDelete?: () => void;
  onUpload: (url: string, publicId: string) => void;
  priority?: boolean;
  sizes?: string;
  src: string | undefined;
}

export function EditableImage({
  src,
  alt,
  onUpload,
  onDelete,
  deleteLabel,
  folder,
  fill = true,
  sizes,
  className = "object-cover",
  priority = false,
}: EditableImageProps) {
  const { isEditMode } = useEditMode();
  const { upload } = useImageAssets();
  const [uploading, setUploading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(
    async (file: File) => {
      setUploading(true);
      const result = await upload(file, folder);
      onUpload(result.url, result.publicId);
      setUploading(false);
    },
    [folder, onUpload, upload]
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
        <div className="flex h-full w-full items-center justify-center bg-card">
          {isEditMode && <Camera className="h-8 w-8 text-foreground/20" />}
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
          {src && onDelete ? (
            <>
              <button
                className="absolute top-2 right-2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-destructive/80 text-destructive-foreground transition-opacity hover:bg-destructive"
                onClick={() => setConfirmOpen(true)}
                type="button"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <Dialog
                onOpenChange={(v) => !v && setConfirmOpen(false)}
                open={confirmOpen}
              >
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete {deleteLabel ?? "image"}</DialogTitle>
                    <DialogDescription>
                      This image will be removed when you save. You can undo by
                      discarding changes.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button
                      onClick={() => setConfirmOpen(false)}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        setConfirmOpen(false);
                        onDelete();
                      }}
                      variant="destructive"
                    >
                      Delete
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          ) : null}
          <input
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleUpload(file);
              }
              e.target.value = "";
            }}
            ref={fileInputRef}
            type="file"
          />
        </>
      ) : null}
    </>
  );
}
