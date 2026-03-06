"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Quote,
  Minus,
  Undo,
  Redo,
} from "lucide-react";
import { cn } from "@/lib/utils";

type RichTextEditorProps = {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
  disabled?: boolean;
  className?: string;
  /** Optional: controlled editor for external updates */
  editorKey?: string;
  /** "blur" = only call onChange on blur (for inline save). "live" = call on every change (for forms). */
  mode?: "blur" | "live";
};

function MenuButton({
  onClick,
  isActive,
  disabled,
  children,
  title,
}: {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "flex size-8 items-center justify-center rounded transition-colors",
        "hover:bg-muted disabled:opacity-50",
        isActive && "bg-muted text-foreground"
      )}
    >
      {children}
    </button>
  );
}

function normalizeContent(value: string): string {
  if (!value?.trim()) return "";
  if (value.trim().startsWith("<")) return value;
  return `<p>${value}</p>`;
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = "Add a description…",
  minHeight = "200px",
  disabled = false,
  className,
  editorKey,
  mode = "blur",
}: RichTextEditorProps) {
  const editor = useEditor({
    key: editorKey,
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Placeholder.configure({ placeholder }),
    ],
    content: normalizeContent(content || ""),
    editable: !disabled,
    onBlur: ({ editor: ed }) => {
      const html = ed.getHTML();
      if (html !== content) onChange(html);
    },
    ...(mode === "live" && {
      onUpdate: ({ editor: ed }: { editor: { getHTML: () => string } }) => {
        const html = ed.getHTML();
        if (html !== content) onChange(html);
      },
    }),
    editorProps: {
      attributes: {
        class:
          "min-h-[120px] px-4 py-3 focus:outline-none prose prose-sm dark:prose-invert max-w-none min-w-0 [&_h2]:text-base [&_h2]:font-semibold [&_h3]:text-sm [&_h3]:font-medium [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:border-l-4 [&_blockquote]:border-muted [&_blockquote]:pl-4 [&_blockquote]:italic [&_p]:my-2",
      },
    },
  });

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-background shadow-sm transition-shadow focus-within:ring-2 focus-within:ring-ring/20",
        disabled && "opacity-60",
        className
      )}
    >
      <div className="flex shrink-0 flex-wrap items-center gap-0.5 border-b border-border bg-muted/20 px-2 py-1.5">
        <MenuButton
          onClick={() => editor?.chain().focus().toggleBold().run()}
          isActive={editor?.isActive("bold")}
          disabled={!editor || disabled}
          title="Bold"
        >
          <Bold className="size-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          isActive={editor?.isActive("italic")}
          disabled={!editor || disabled}
          title="Italic"
        >
          <Italic className="size-4" />
        </MenuButton>
        <div className="mx-1 h-4 w-px bg-border" />
        <MenuButton
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor?.isActive("heading", { level: 2 })}
          disabled={!editor || disabled}
          title="Heading"
        >
          <Heading2 className="size-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          isActive={editor?.isActive("bulletList")}
          disabled={!editor || disabled}
          title="Bullet list"
        >
          <List className="size-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          isActive={editor?.isActive("orderedList")}
          disabled={!editor || disabled}
          title="Numbered list"
        >
          <ListOrdered className="size-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          isActive={editor?.isActive("blockquote")}
          disabled={!editor || disabled}
          title="Quote"
        >
          <Quote className="size-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor?.chain().focus().setHorizontalRule().run()}
          disabled={!editor || disabled}
          title="Divider"
        >
          <Minus className="size-4" />
        </MenuButton>
        <div className="mx-1 h-4 w-px bg-border" />
        <MenuButton
          onClick={() => editor?.chain().focus().undo().run()}
          disabled={!editor?.can().undo() || disabled}
          title="Undo"
        >
          <Undo className="size-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor?.chain().focus().redo().run()}
          disabled={!editor?.can().redo() || disabled}
          title="Redo"
        >
          <Redo className="size-4" />
        </MenuButton>
      </div>
      <div
        className="[&_.tiptap]:outline-none"
        style={{ minHeight }}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
