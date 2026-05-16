"use client";

import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
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
import { useEditMode } from "./edit-mode-context";

interface ExitGuard {
  requestExit: (onExit?: () => void) => void;
}

// biome-ignore lint/suspicious/noEmptyBlockStatements: intentional no-op for default context
function noop() {}

const ExitGuardContext = createContext<ExitGuard>({
  requestExit: noop,
});

export function useExitGuard() {
  return useContext(ExitGuardContext);
}

export function UnsavedChangesGuard({ children }: { children: ReactNode }) {
  const { hasChanges, save, discard } = useDraftBufferState();
  const { exitEditMode } = useEditMode();
  const [showDialog, setShowDialog] = useState(false);
  const pendingCallbackRef = useRef<(() => void) | undefined>(undefined);

  const requestExit = useCallback(
    (onExit?: () => void) => {
      if (hasChanges) {
        pendingCallbackRef.current = onExit;
        setShowDialog(true);
      } else {
        exitEditMode();
        onExit?.();
      }
    },
    [hasChanges, exitEditMode]
  );

  const handleSave = async () => {
    await save();
    setShowDialog(false);
    exitEditMode();
    pendingCallbackRef.current?.();
    pendingCallbackRef.current = undefined;
  };

  const handleDiscard = () => {
    discard();
    setShowDialog(false);
    exitEditMode();
    pendingCallbackRef.current?.();
    pendingCallbackRef.current = undefined;
  };

  const handleStay = () => {
    setShowDialog(false);
    pendingCallbackRef.current = undefined;
  };

  return (
    <ExitGuardContext value={{ requestExit }}>
      {children}
      <Dialog onOpenChange={handleStay} open={showDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unsaved changes</DialogTitle>
            <DialogDescription>
              You have unsaved changes. Would you like to save them before
              leaving?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
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
    </ExitGuardContext>
  );
}
