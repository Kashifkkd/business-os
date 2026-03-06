"use client";

import { useCallback, useMemo, useState } from "react";
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
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EmptyState } from "@/components/empty-state";
import { DateDisplay } from "@/components/date-display";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { LeadActivity } from "@/lib/supabase/types";
import {
  useCreateLeadActivity,
  useUpdateLeadActivity,
  useDeleteLeadActivity,
} from "@/hooks/use-leads";
import { NoteAttachmentUpload, type NoteAttachment } from "./note-attachment-upload";
import { StickyNote } from "lucide-react";

type LeadNotesTabProps = {
  orgId: string;
  leadId: string;
  activities: LeadActivity[];
  activitiesLoading: boolean;
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

function getTitleFromMetadata(metadata?: Record<string, unknown>): string {
  const t = metadata?.title;
  return typeof t === "string" ? t.trim() : "";
}

function getAttachmentsFromMetadata(metadata?: Record<string, unknown>): NoteAttachment[] {
  const arr = metadata?.attachments;
  if (!Array.isArray(arr)) return [];
  return arr
    .filter(
      (a): a is { url: string; name: string; size?: number } =>
        a && typeof a === "object" && typeof (a as { url?: unknown }).url === "string" && typeof (a as { name?: unknown }).name === "string"
    )
    .map((a) => ({ url: a.url, name: a.name, size: a.size }));
}

export function LeadNotesTab({
  orgId,
  leadId,
  activities,
  activitiesLoading,
}: LeadNotesTabProps) {
  const notes = useMemo(
    () => activities.filter((a) => a.type === "note").sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [activities]
  );

  const createActivity = useCreateLeadActivity(orgId, leadId);
  const updateActivity = useUpdateLeadActivity(orgId, leadId);
  const deleteActivity = useDeleteLeadActivity(orgId, leadId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openCreate = () => {
    setEditingId(null);
    setDialogOpen(true);
  };

  const openEdit = (note: LeadActivity) => {
    setEditingId(note.id);
    setDialogOpen(true);
  };

  const closeDialog = useCallback(() => {
    setDialogOpen(false);
    setEditingId(null);
  }, []);

  const handleSaveNote = useCallback(
    async (title: string, content: string, attachments: NoteAttachment[]) => {
      const metadata = { title: title.trim() || undefined, attachments };
      if (editingId) {
        await updateActivity.mutateAsync({
          activityId: editingId,
          content: content || null,
          metadata,
        });
      } else {
        await createActivity.mutateAsync({
          type: "note",
          content: content || null,
          metadata,
        });
      }
      closeDialog();
    },
    [editingId, createActivity, updateActivity, closeDialog]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (deleteId) {
      await deleteActivity.mutateAsync(deleteId);
      setDeleteId(null);
    }
  }, [deleteId, deleteActivity]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
        <p className="text-muted-foreground text-sm">
          {activitiesLoading
            ? "Loading…"
            : notes.length === 0
              ? "No notes"
              : `${notes.length} note${notes.length === 1 ? "" : "s"}`}
        </p>
        <Button size="sm" onClick={openCreate} className="gap-1.5">
          <Plus className="size-3.5" />
          Create note
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {activitiesLoading ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : notes.length === 0 ? (
          <EmptyState
            title="No notes yet"
            description="Add notes about this lead. Use the Create note button to add your first note."
            icon={StickyNote}
            action={
              <Button size="sm" onClick={openCreate} className="gap-1.5">
                <Plus className="size-3.5" />
                Create note
              </Button>
            }
          />
        ) : (
          <ul className="space-y-3">
            {notes.map((note) => (
              <li
                key={note.id}
                className="rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/30"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <DateDisplay value={note.created_at} variant="timeAgo" layout="inline" />
                    </div>
                    {getTitleFromMetadata(note.metadata) && (
                      <h3 className="mt-1 font-medium text-foreground">
                        {getTitleFromMetadata(note.metadata)}
                      </h3>
                    )}
                    {note.content ? (
                      note.content.startsWith("<") ? (
                        <div
                          className="mt-1 text-sm text-foreground [&_h2]:text-base [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:border-l-4 [&_blockquote]:border-muted [&_blockquote]:pl-4 [&_blockquote]:italic [&_p]:my-1"
                          dangerouslySetInnerHTML={{ __html: note.content }}
                        />
                      ) : (
                        <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{note.content}</p>
                      )
                    ) : !getTitleFromMetadata(note.metadata) && (
                      <p className="mt-1 text-muted-foreground text-sm italic">Empty note</p>
                    )}
                    {getAttachmentsFromMetadata(note.metadata).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {getAttachmentsFromMetadata(note.metadata).map((a) => (
                          <a
                            key={a.url}
                            href={a.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded border bg-muted/50 px-2 py-0.5 text-xs text-primary hover:underline"
                          >
                            {a.name}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => openEdit(note)}
                      aria-label="Edit note"
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(note.id)}
                      aria-label="Delete note"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <NoteEditorDialog
        key={editingId ?? "create"}
        open={dialogOpen}
        onOpenChange={(open) => !open && closeDialog()}
        orgId={orgId}
        leadId={leadId}
        editingNote={editingId ? notes.find((n) => n.id === editingId) ?? null : null}
        onSave={handleSaveNote}
        isPending={createActivity.isPending || updateActivity.isPending}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete note?</AlertDialogTitle>
            <AlertDialogDescription>
              This note will be permanently deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

type NoteEditorDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  leadId: string;
  editingNote: LeadActivity | null;
  onSave: (title: string, content: string, attachments: NoteAttachment[]) => Promise<void>;
  isPending: boolean;
};

function NoteEditorDialog({
  open,
  onOpenChange,
  orgId,
  leadId,
  editingNote,
  onSave,
  isPending,
}: NoteEditorDialogProps) {
  const [title, setTitle] = useState(() =>
    editingNote ? getTitleFromMetadata(editingNote.metadata) : ""
  );
  const [attachments, setAttachments] = useState<NoteAttachment[]>(() =>
    editingNote ? getAttachmentsFromMetadata(editingNote.metadata) : []
  );

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Placeholder.configure({ placeholder: "Write your note… Title or content required." }),
    ],
    content: editingNote?.content ?? "",
    editorProps: {
      attributes: {
        class:
          "min-h-[180px] px-4 py-3 focus:outline-none [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:text-base [&_h3]:font-medium [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:border-l-4 [&_blockquote]:border-muted [&_blockquote]:pl-4 [&_blockquote]:italic [&_p]:my-2",
      },
    },
  });

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) onOpenChange(false);
    },
    [onOpenChange]
  );

  const handleSave = useCallback(async () => {
    if (!editor) return;
    const html = editor.getHTML();
    const contentText = editor.getText().trim();
    const hasTitle = title.trim().length > 0;
    const hasContent = contentText.length > 0;
    if (!hasTitle && !hasContent) return;
    await onSave(title.trim(), html, attachments);
    setTitle("");
    editor.commands.clearContent();
    setAttachments([]);
    onOpenChange(false);
  }, [editor, title, attachments, onSave, onOpenChange]);

  const hasTitle = title.trim().length > 0;
  const hasContent = (editor?.getText().trim().length ?? 0) > 0;
  const canSave = (hasTitle || hasContent) && !isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl" showCloseButton>
        <DialogHeader>
          <DialogTitle>{editingNote ? "Edit note" : "Create note"}</DialogTitle>
          <DialogDescription>
            {editingNote
              ? "Update the note content and attachments."
              : "Add a note for this lead. You can format text and attach files."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="note-title">Title</Label>
            <Input
              id="note-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Follow-up call, Meeting notes"
              maxLength={200}
              className="w-full"
            />
            <p className="text-muted-foreground text-xs">
              Optional. Add a title to quickly identify this note.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Content</Label>
            <div className="rounded-md border">
              <div className="flex shrink-0 flex-wrap items-center gap-0.5 border-b border-border bg-muted/30 px-2 py-1">
                <MenuButton
                  onClick={() => editor?.chain().focus().toggleBold().run()}
                  isActive={editor?.isActive("bold")}
                  disabled={!editor}
                  title="Bold"
                >
                  <Bold className="size-4" />
                </MenuButton>
                <MenuButton
                  onClick={() => editor?.chain().focus().toggleItalic().run()}
                  isActive={editor?.isActive("italic")}
                  disabled={!editor}
                  title="Italic"
                >
                  <Italic className="size-4" />
                </MenuButton>
                <div className="mx-1 h-4 w-px bg-border" />
                <MenuButton
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                  isActive={editor?.isActive("heading", { level: 2 })}
                  disabled={!editor}
                  title="Heading"
                >
                  <Heading2 className="size-4" />
                </MenuButton>
                <MenuButton
                  onClick={() => editor?.chain().focus().toggleBulletList().run()}
                  isActive={editor?.isActive("bulletList")}
                  disabled={!editor}
                  title="Bullet list"
                >
                  <List className="size-4" />
                </MenuButton>
                <MenuButton
                  onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                  isActive={editor?.isActive("orderedList")}
                  disabled={!editor}
                  title="Numbered list"
                >
                  <ListOrdered className="size-4" />
                </MenuButton>
                <MenuButton
                  onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                  isActive={editor?.isActive("blockquote")}
                  disabled={!editor}
                  title="Quote"
                >
                  <Quote className="size-4" />
                </MenuButton>
                <MenuButton
                  onClick={() => editor?.chain().focus().setHorizontalRule().run()}
                  disabled={!editor}
                  title="Divider"
                >
                  <Minus className="size-4" />
                </MenuButton>
                <div className="mx-1 h-4 w-px bg-border" />
                <MenuButton
                  onClick={() => editor?.chain().focus().undo().run()}
                  disabled={!editor?.can().undo()}
                  title="Undo"
                >
                  <Undo className="size-4" />
                </MenuButton>
                <MenuButton
                  onClick={() => editor?.chain().focus().redo().run()}
                  disabled={!editor?.can().redo()}
                  title="Redo"
                >
                  <Redo className="size-4" />
                </MenuButton>
              </div>
              <div className="[&_.tiptap]:min-h-[180px] [&_.tiptap]:outline-none [&_.tiptap_p]:my-2 [&_.tiptap_ul]:my-2 [&_.tiptap_ol]:my-2">
                <EditorContent editor={editor} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Attachments</Label>
            <NoteAttachmentUpload
              orgId={orgId}
              leadId={leadId}
              attachments={attachments}
              onChange={setAttachments}
              disabled={isPending}
            />
          </div>
        </div>

        <DialogFooter showCloseButton={false}>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!canSave}
          >
            {isPending ? "Saving…" : editingNote ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
