"use client";

import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import "@blocknote/mantine/style.css";
import { useEffect, useRef } from "react";

interface BlockEditorProps {
  content: string;
  editable?: boolean;
  onChange?: (content: string) => void;
}

/**
 * BlockNote editor wrapper. Content is stored as JSON string.
 * When editable is false, renders as a read-only view.
 */
export function BlockEditor({
  content,
  onChange,
  editable = true,
}: BlockEditorProps) {
  const initialContent = useRef(content);
  const editor = useCreateBlockNote({
    initialContent: parseContent(initialContent.current),
  });

  // Sync content changes back
  useEffect(() => {
    if (!editable) {
      return;
    }

    const handler = () => {
      const json = JSON.stringify(editor.document);
      onChange?.(json);
    };

    // Listen for changes via the editor's onChange
    editor.onChange(handler);
  }, [editor, editable, onChange]);

  // Update content when it changes externally (e.g., locale switch)
  useEffect(() => {
    if (content !== initialContent.current) {
      initialContent.current = content;
      const parsed = parseContent(content);
      if (parsed) {
        editor.replaceBlocks(editor.document, parsed);
      }
    }
  }, [content, editor]);

  return (
    <div className="[&_.bn-container]:!bg-transparent [&_.bn-editor]:!text-foreground [&_.bn-editor]:!font-sans rounded-lg">
      <BlockNoteView editable={editable} editor={editor} theme="dark" />
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
