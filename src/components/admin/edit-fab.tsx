"use client";

import { useAuth } from "@clerk/nextjs";
import { Pencil } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEditMode } from "./edit-mode-context";

export function EditFab() {
  const { isSignedIn } = useAuth();
  const { isEditMode, toggleEditMode } = useEditMode();

  if (!isSignedIn || isEditMode) {
    return null;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          aria-label="Enter edit mode"
          className="fixed right-6 bottom-6 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-foreground/20 bg-foreground/10 text-foreground/70 shadow-lg backdrop-blur-md transition-all hover:scale-110 hover:bg-foreground/20 hover:text-foreground"
          onClick={toggleEditMode}
          type="button"
        >
          <Pencil className="h-5 w-5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="left" sideOffset={8}>
        Enter edit mode
      </TooltipContent>
    </Tooltip>
  );
}
