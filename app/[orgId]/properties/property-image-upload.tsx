"use client";

import { useRef, useState } from "react";
import { Camera, X, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { uploadPropertyImage } from "@/lib/supabase/upload";

const MAX_FILES = 12;
const ACCEPT = "image/jpeg,image/png,image/webp";

type PropertyImageUploadProps = {
  orgId: string;
  urls: string[];
  onChange: (urls: string[]) => void;
  disabled?: boolean;
  className?: string;
};

export function PropertyImageUpload({
  orgId,
  urls,
  onChange,
  disabled,
  className,
}: PropertyImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

  async function handleFileSelect(files: FileList | null) {
    if (!files?.length || urls.length >= MAX_FILES) return;
    setError(null);
    setUploading(true);
    const next: string[] = [...urls];
    for (let i = 0; i < files.length && next.length < MAX_FILES; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.set("file", file);
      const result = await uploadPropertyImage(orgId, formData);
      if ("url" in result) next.push(result.url);
      else setError(result.error);
    }
    onChange(next);
    setUploading(false);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    handleFileSelect(e.target.files);
    e.target.value = "";
  }

  function remove(url: string) {
    onChange(urls.filter((u) => u !== url));
  }

  function moveImage(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return;
    const next = [...urls];
    const [removed] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, removed);
    onChange(next);
  }

  function handleDragStart(e: React.DragEvent, index: number) {
    if (disabled) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  }

  function handleDragEnd() {
    setDraggedIndex(null);
    setDropTargetIndex(null);
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (draggedIndex !== null && draggedIndex !== index) setDropTargetIndex(index);
  }

  function handleDragLeave() {
    setDropTargetIndex(null);
  }

  function handleDrop(e: React.DragEvent, toIndex: number) {
    e.preventDefault();
    setDropTargetIndex(null);
    if (draggedIndex === null || disabled) return;
    moveImage(draggedIndex, toIndex);
    setDraggedIndex(null);
  }

  function handleDropZoneDrop(e: React.DragEvent) {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files?.length) handleFileSelect(files);
  }

  function handleDropZoneDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap items-start gap-3">
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="sr-only"
          aria-label="Upload property images"
          disabled={disabled || uploading || urls.length >= MAX_FILES}
          onChange={handleInputChange}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDrop={handleDropZoneDrop}
          onDragOver={handleDropZoneDragOver}
          disabled={disabled || uploading || urls.length >= MAX_FILES}
          className={cn(
            "flex size-28 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed transition-colors",
            "border-muted-foreground/25 bg-muted/30 hover:bg-muted/50 hover:border-muted-foreground/40",
            "disabled:opacity-50 disabled:pointer-events-none"
          )}
        >
          <Camera className="size-8 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {uploading ? "…" : "Upload"}
          </span>
          <span className="text-[10px] text-muted-foreground/80">or drop</span>
        </button>
        {urls.map((url, index) => (
          <div
            key={url}
            draggable={!disabled}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            className={cn(
              "relative size-28 shrink-0 cursor-grab overflow-hidden rounded-lg border bg-muted active:cursor-grabbing sm:size-32",
              draggedIndex === index && "opacity-50",
              dropTargetIndex === index && "ring-2 ring-primary ring-offset-2"
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="pointer-events-none size-full object-cover" />
            {index === 0 && (
              <span className="absolute bottom-0 left-0 right-0 bg-black/70 py-0.5 text-center text-[10px] font-medium text-white">
                Cover
              </span>
            )}
            <div className="absolute left-1 top-1 flex items-center gap-0.5">
              <GripVertical className="size-3.5 text-white drop-shadow" aria-hidden />
            </div>
            <Button
              type="button"
              variant="secondary"
              size="icon-xs"
              className="absolute right-1 top-1 size-6 rounded-full bg-black/50 text-white hover:bg-black/70"
              onClick={() => remove(url)}
              disabled={disabled}
              aria-label="Remove image"
            >
              <X className="size-3" />
            </Button>
          </div>
        ))}
      </div>
      {error && <p className="text-destructive text-xs">{error}</p>}
      <p className="text-muted-foreground text-xs">
        First image is the cover. Drag to reorder. Up to {MAX_FILES} images. JPEG, PNG, WebP. 5MB each.
      </p>
    </div>
  );
}
