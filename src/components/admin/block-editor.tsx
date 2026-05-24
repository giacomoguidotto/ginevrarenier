"use client";

import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import "@blocknote/mantine/style.css";
import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";

interface BlockEditorProps {
  content: string;
  editable?: boolean;
  onChange?: (content: string) => void;
}

export function BlockEditor({
  content,
  onChange,
  editable = true,
}: BlockEditorProps) {
  const { resolvedTheme } = useTheme();
  const lastJsonRef = useRef(content);
  const editor = useCreateBlockNote({
    initialContent: parseContent(lastJsonRef.current),
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: mount-only — capture the editor's normalized initial state once
  useEffect(() => {
    lastJsonRef.current = JSON.stringify(editor.document);
  }, []);

  // Sync user edits back — skip if content matches last known state
  useEffect(() => {
    if (!editable) {
      return;
    }

    const handler = () => {
      const json = JSON.stringify(editor.document);
      if (json === lastJsonRef.current) {
        return;
      }
      lastJsonRef.current = json;
      onChange?.(json);
    };

    return editor.onChange(handler);
  }, [editor, editable, onChange]);

  // Update content when it changes externally (e.g., locale switch)
  useEffect(() => {
    if (content !== lastJsonRef.current) {
      const parsed = parseContent(content);
      const currentJson = JSON.stringify(editor.document);
      if (parsed && content !== currentJson) {
        editor.replaceBlocks(editor.document, parsed);
      }
      lastJsonRef.current = JSON.stringify(editor.document);
    }
  }, [content, editor]);

  return (
    <div className="[&_.bn-container]:!bg-transparent [&_.bn-editor]:!bg-transparent [&_.bn-editor]:!text-foreground [&_.bn-editor]:!font-sans rounded-lg">
      <BlockNoteView
        editable={editable}
        editor={editor}
        theme={resolvedTheme as "light" | "dark"}
      />
    </div>
  );
}

function parseContent(content: string) {
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {
    // ignore
  }
  return;
}
