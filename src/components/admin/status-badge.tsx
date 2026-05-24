"use client";

export function StatusBadge({
  className = "",
  pendingDeletion,
  publishOverride,
  published,
}: {
  className?: string;
  pendingDeletion?: boolean;
  publishOverride: boolean | undefined;
  published: boolean;
}) {
  if (pendingDeletion) {
    return (
      <div
        className={`absolute z-10 rounded bg-destructive/20 px-2 py-0.5 font-mono text-[10px] text-destructive uppercase backdrop-blur-sm ${className}`}
      >
        Pending deletion
      </div>
    );
  }
  if (publishOverride !== undefined) {
    return publishOverride ? (
      <div
        className={`absolute z-10 rounded bg-primary/20 px-2 py-0.5 font-mono text-[10px] text-primary uppercase backdrop-blur-sm ${className}`}
      >
        Pending publish
      </div>
    ) : (
      <div
        className={`absolute z-10 rounded bg-foreground/10 px-2 py-0.5 font-mono text-[10px] text-foreground/50 uppercase backdrop-blur-sm ${className}`}
      >
        Pending unpublish
      </div>
    );
  }
  if (!published) {
    return (
      <div
        className={`absolute z-10 rounded bg-foreground/10 px-2 py-0.5 font-mono text-[10px] text-foreground/50 uppercase backdrop-blur-sm ${className}`}
      >
        Unpublished
      </div>
    );
  }
  return null;
}
