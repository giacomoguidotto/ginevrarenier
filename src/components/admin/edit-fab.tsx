"use client";

import { useAuth } from "@clerk/nextjs";
import { AnimatePresence, motion } from "framer-motion";
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

  if (isSignedIn !== true) {
    return null;
  }

  return (
    <AnimatePresence>
      {!isEditMode && (
        <motion.div
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          initial={{ opacity: 0, scale: 0.8 }}
          key="edit-fab"
          transition={{ duration: 0.2 }}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                aria-label="Enter edit mode"
                className="fixed right-6 bottom-6 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white/70 shadow-lg backdrop-blur-md transition-all hover:scale-110 hover:bg-black/60 hover:text-white"
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
        </motion.div>
      )}
    </AnimatePresence>
  );
}
