"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  rectSortingStrategy,
  SortableContext,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { api } from "convex/_generated/api";
import type { Doc, Id } from "convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { ImageIcon, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useEditMode } from "./edit-mode-context";
import { deleteCloudinaryImage, uploadImage } from "./image-upload";

type ProjectImage = Doc<"projectImages">;

function DropZone({
  children,
  onDragOver,
  onDrop,
}: {
  children: React.ReactNode;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}) {
  return (
    // biome-ignore lint/a11y/noNoninteractiveElementInteractions: file drop target
    // biome-ignore lint/a11y/noStaticElementInteractions: file drop target
    <div onDragOver={onDragOver} onDrop={onDrop}>
      {children}
    </div>
  );
}

function SortableImage({
  image,
  onDelete,
  onSetCover,
}: {
  image: ProjectImage;
  onDelete: () => void;
  onSetCover: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: image._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className="group relative cursor-grab break-inside-avoid overflow-hidden rounded-lg active:cursor-grabbing"
          ref={setNodeRef}
          style={style}
          {...attributes}
          {...listeners}
        >
          <Image
            alt="Project photograph"
            className="w-full transition-transform duration-300 group-hover:scale-105"
            height={1200}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            src={image.url}
            width={800}
          />
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={onSetCover}>
          <ImageIcon className="mr-2 h-4 w-4" />
          Set as cover
        </ContextMenuItem>
        <ContextMenuItem
          className="text-red-400 focus:text-red-400"
          onClick={onDelete}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

interface EditableImageGridProps {
  images: ProjectImage[];
  projectId: Id<"projects">;
  projectSlug: string;
}

export function EditableImageGrid({
  images,
  projectId,
  projectSlug,
}: EditableImageGridProps) {
  const { isEditMode } = useEditMode();
  const addImage = useMutation(api.projectImages.add);
  const removeImage = useMutation(api.projectImages.remove);
  const reorderImages = useMutation(api.projectImages.reorder);
  const setCover = useMutation(api.projects.setCover);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;
      if (!over || active.id === over.id) {
        return;
      }

      const oldIndex = images.findIndex((img) => img._id === active.id);
      const newIndex = images.findIndex((img) => img._id === over.id);
      if (oldIndex === -1 || newIndex === -1) {
        return;
      }

      // Compute new order
      const reordered = [...images];
      const [moved] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, moved);
      reorderImages({ ids: reordered.map((img) => img._id) });
    },
    [images, reorderImages]
  );

  const handleUpload = useCallback(
    async (files: FileList) => {
      setUploading(true);
      for (const file of files) {
        const result = await uploadImage(file, `ginevrarenier/${projectSlug}`);
        await addImage({
          projectId,
          url: result.url,
          cloudinaryPublicId: result.publicId,
        });
      }
      setUploading(false);
    },
    [projectId, projectSlug, addImage]
  );

  const handleDelete = useCallback(
    async (image: ProjectImage) => {
      await deleteCloudinaryImage(image.cloudinaryPublicId);
      await removeImage({ id: image._id });
    },
    [removeImage]
  );

  const handleSetCover = useCallback(
    (imageId: Id<"projectImages">) => {
      setCover({ projectId, imageId });
    },
    [projectId, setCover]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer.files.length > 0) {
        handleUpload(e.dataTransfer.files);
      }
    },
    [handleUpload]
  );

  if (!isEditMode) {
    return null;
  }

  const activeImage = activeId
    ? images.find((img) => img._id === activeId)
    : null;

  return (
    <DropZone onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
      <DndContext
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
        sensors={sensors}
      >
        <SortableContext
          items={images.map((img) => img._id)}
          strategy={rectSortingStrategy}
        >
          <div className="columns-1 gap-4 space-y-4 sm:columns-2 lg:columns-3">
            {images.map((image) => (
              <SortableImage
                image={image}
                key={image._id}
                onDelete={() => handleDelete(image)}
                onSetCover={() => handleSetCover(image._id)}
              />
            ))}

            {/* Upload button */}
            <button
              className="flex aspect-square w-full items-center justify-center rounded-lg border-2 border-foreground/15 border-dashed text-foreground/30 transition-colors hover:border-foreground/30 hover:text-foreground/50"
              onClick={() => fileInputRef.current?.click()}
              type="button"
            >
              {uploading ? (
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground/60" />
              ) : (
                <Plus className="h-8 w-8" />
              )}
            </button>
          </div>
        </SortableContext>

        <DragOverlay>
          {activeImage ? (
            <div className="rounded-lg opacity-80 shadow-2xl">
              <Image
                alt="Dragging"
                className="w-full rounded-lg"
                height={300}
                src={activeImage.url}
                width={200}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <input
        accept="image/*"
        className="hidden"
        multiple
        onChange={(e) => {
          if (e.target.files) {
            handleUpload(e.target.files);
          }
        }}
        ref={fileInputRef}
        type="file"
      />
    </DropZone>
  );
}
