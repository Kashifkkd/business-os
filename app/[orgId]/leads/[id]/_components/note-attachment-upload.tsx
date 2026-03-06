"use client";

import { useRef, useState } from "react";
import { Paperclip, X, FileText, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { uploadLeadNoteAttachment } from "@/lib/supabase/upload";

const MAX_FILES = 5;
const ACCEPT = "image/jpeg,image/png,image/webp,application/pdf,text/plain";

export type NoteAttachment = { url: string; name: string; size?: number };

type NoteAttachmentUploadProps = {
  orgId: string;
  leadId: string;
  attachments: NoteAttachment[];
  onChange: (attachments: NoteAttachment[]) => void;
  disabled?: boolean;
  className?: string;
};

export function NoteAttachmentUpload({
  orgId,
  leadId,
  attachments,
  onChange,
  disabled,
  className,
}: NoteAttachmentUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileSelect(files: FileList | null) {
    if (!files?.length || attachments.length >= MAX_FILES) return;
    setError(null);
    setUploading(true);
    const next: NoteAttachment[] = [...attachments];
    for (let i = 0; i < files.length && next.length < MAX_FILES; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.set("file", file);
      const result = await uploadLeadNoteAttachment(orgId, leadId, formData);
      if ("url" in result) {
        next.push({ url: result.url, name: file.name, size: file.size });
      } else {
        setError(result.error);
      }
    }
    onChange(next);
    setUploading(false);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    handleFileSelect(e.target.files);
    e.target.value = "";
  }

  function remove(idx: number) {
    onChange(attachments.filter((_, i) => i !== idx));
  }

  const isImage = (name: string) =>
    /\.(jpe?g|png|webp)(\?|$)/i.test(name);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="sr-only"
          aria-label="Upload attachments"
          disabled={disabled || uploading || attachments.length >= MAX_FILES}
          onChange={handleInputChange}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || uploading || attachments.length >= MAX_FILES}
          className="gap-1.5"
        >
          <Paperclip className="size-3.5" />
          {uploading ? "Uploading…" : "Add attachment"}
        </Button>
        {attachments.map((a, idx) => (
          <div
            key={a.url}
            className="flex items-center gap-1.5 rounded-md border bg-muted/50 px-2 py-1.5 text-xs"
          >
            {isImage(a.name) ? (
              <Image className="size-3.5 shrink-0 text-muted-foreground" />
            ) : (
              <FileText className="size-3.5 shrink-0 text-muted-foreground" />
            )}
            <a
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              className="max-w-[120px] truncate text-primary hover:underline"
            >
              {a.name}
            </a>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-6 shrink-0"
              onClick={() => remove(idx)}
              disabled={disabled}
              aria-label="Remove attachment"
            >
              <X className="size-3" />
            </Button>
          </div>
        ))}
      </div>
      {error && <p className="text-destructive text-xs">{error}</p>}
      <p className="text-muted-foreground text-xs">
        Up to {MAX_FILES} files. JPEG, PNG, WebP, PDF, plain text. 10MB each.
      </p>
    </div>
  );
}
