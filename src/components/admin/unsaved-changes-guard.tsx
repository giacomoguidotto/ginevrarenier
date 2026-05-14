"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDraftBufferState } from "./draft-buffer-context";

export function UnsavedChangesGuard() {
  const { hasChanges, save, discard } = useDraftBufferState();

  const [showDialog, setShowDialog] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  // Browser beforeunload warning
  useEffect(() => {
    if (!hasChanges) {
      return;
    }

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasChanges]);

  // Intercept link clicks for in-app navigation
  useEffect(() => {
    if (!hasChanges) {
      return;
    }

    const handler = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) {
        return;
      }

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("#")) {
        return;
      }

      // Internal navigation — intercept
      e.preventDefault();
      e.stopPropagation();
      setPendingHref(href);
      setShowDialog(true);
    };

    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, [hasChanges]);

  const handleSave = async () => {
    await save();
    setShowDialog(false);
    if (pendingHref) {
      window.location.href = pendingHref;
    }
  };

  const handleDiscard = () => {
    discard();
    setShowDialog(false);
    if (pendingHref) {
      window.location.href = pendingHref;
    }
  };

  const handleStay = () => {
    setShowDialog(false);
    setPendingHref(null);
  };

  return (
    <Dialog onOpenChange={handleStay} open={showDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Unsaved changes</DialogTitle>
          <DialogDescription>
            You have unsaved changes. Would you like to save them before
            leaving?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button onClick={handleStay} variant="outline">
            Stay
          </Button>
          <Button onClick={handleDiscard} variant="ghost">
            Discard
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
