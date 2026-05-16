"use client";

import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useId, useRef, useState } from "react";

import { insertMenuItemFields } from "@/lib/menu/actions";
import { MENU_IMAGE_ACCEPT, MENU_IMAGE_MAX_BYTES } from "@/lib/menu/menu-image-storage";
import { uploadMenuItemImage } from "@/lib/menu/upload-menu-image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function AddMenuItemDialog() {
  const router = useRouter();
  const formId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileLabel, setFileLabel] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const reset = useCallback(() => {
    setName("");
    setDescription("");
    setPrice("");
    setImageUrl("");
    setFile(null);
    setFileLabel(null);
    setError(null);
    setFieldErrors({});
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      reset();
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setSubmitting(true);

    try {
      let resolvedImageUrl = imageUrl.trim();

      if (file) {
        const up = await uploadMenuItemImage(file);
        if ("error" in up) {
          setError(up.error);
          setSubmitting(false);
          return;
        }
        resolvedImageUrl = up.url;
      }

      const result = await insertMenuItemFields({
        name,
        description,
        price,
        ...(resolvedImageUrl.trim() ? { image_url: resolvedImageUrl.trim() } : {}),
      });

      if (result.fieldErrors) {
        setFieldErrors(result.fieldErrors);
        setSubmitting(false);
        return;
      }
      if (result.error) {
        setError(result.error);
        setSubmitting(false);
        return;
      }

      setOpen(false);
      reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" className="gap-2">
          <Plus className="size-4 shrink-0" aria-hidden />
          Add dish
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[min(90vh,640px)] overflow-y-auto sm:max-w-lg" showCloseButton>
        <DialogHeader>
          <DialogTitle>Add menu item</DialogTitle>
          <DialogDescription>
            Name, description, and price appear on the public menu. Optionally add a photo via upload (Supabase Storage
            bucket <code className="rounded bg-muted px-1">menu-images</code>) or paste an HTTPS image URL.
          </DialogDescription>
        </DialogHeader>

        <form id={formId} onSubmit={handleSubmit} className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor={`${formId}-name`}>Name</Label>
            <Input
              id={`${formId}-name`}
              value={name}
              onChange={(ev) => setName(ev.target.value)}
              required
              maxLength={120}
              placeholder="Campus bowl"
              disabled={submitting}
            />
            {fieldErrors.name ? (
              <p className="text-xs text-destructive" role="alert">
                {fieldErrors.name}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${formId}-desc`}>Description</Label>
            <Textarea
              id={`${formId}-desc`}
              value={description}
              onChange={(ev) => setDescription(ev.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="What’s in it, dietary notes, etc."
              disabled={submitting}
            />
            {fieldErrors.description ? (
              <p className="text-xs text-destructive" role="alert">
                {fieldErrors.description}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${formId}-price`}>Price (USD)</Label>
            <Input
              id={`${formId}-price`}
              value={price}
              onChange={(ev) => setPrice(ev.target.value)}
              type="text"
              inputMode="decimal"
              placeholder="8.99"
              required
              disabled={submitting}
            />
            {fieldErrors.price ? (
              <p className="text-xs text-destructive" role="alert">
                {fieldErrors.price}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${formId}-file`}>Photo (optional)</Label>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                ref={fileInputRef}
                id={`${formId}-file`}
                type="file"
                accept={MENU_IMAGE_ACCEPT}
                disabled={submitting}
                className="min-w-0 flex-1 cursor-pointer text-foreground file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-xs file:font-medium"
                onChange={(ev) => {
                  const f = ev.target.files?.[0] ?? null;
                  setFile(f);
                  setFileLabel(f ? f.name : null);
                }}
              />
              {file ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={submitting}
                  onClick={() => {
                    setFile(null);
                    setFileLabel(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                >
                  Clear file
                </Button>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">
              Max {(MENU_IMAGE_MAX_BYTES / (1024 * 1024)).toFixed(0)} MB. JPEG, PNG, WebP, or GIF. Upload overrides the
              URL field below.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${formId}-url`}>Image URL (optional)</Label>
            <Input
              id={`${formId}-url`}
              value={imageUrl}
              onChange={(ev) => setImageUrl(ev.target.value)}
              type="url"
              inputMode="url"
              placeholder="https://…"
              disabled={submitting || Boolean(file)}
              className={cn(fieldErrors.image_url && "border-destructive")}
            />
            {file ? (
              <p className="text-xs text-muted-foreground">Clear the file choice to use a URL instead.</p>
            ) : null}
            {fieldErrors.image_url ? (
              <p className="text-xs text-destructive" role="alert">
                {fieldErrors.image_url}
              </p>
            ) : null}
          </div>

          {fileLabel ? (
            <p className="text-xs text-muted-foreground">
              Selected file: <span className="font-medium text-foreground">{fileLabel}</span>
            </p>
          ) : null}

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form={formId} disabled={submitting} className="gap-2">
            {submitting ? (
              <>
                <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
                Saving…
              </>
            ) : (
              "Save dish"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
