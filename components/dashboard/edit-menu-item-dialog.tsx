"use client";

import { Loader2, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useId, useRef, useState } from "react";

import { menuPriceFieldLabel } from "@/constants/site";
import { updateMenuItemAction } from "@/lib/menu/actions";
import { MENU_IMAGE_ACCEPT, MENU_IMAGE_MAX_BYTES } from "@/lib/menu/menu-image-storage";
import type { MenuItem } from "@/lib/menu/types";
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

function priceCentsToInput(cents: number): string {
  return (cents / 100).toFixed(2);
}

type EditMenuItemDialogProps = {
  item: MenuItem;
  disabled?: boolean;
};

export function EditMenuItemDialog({ item, disabled }: EditMenuItemDialogProps) {
  const router = useRouter();
  const formId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState(item.name);
  const [description, setDescription] = useState(item.description);
  const [price, setPrice] = useState(priceCentsToInput(item.price_cents));
  const [imageUrl, setImageUrl] = useState(item.image_url ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [fileLabel, setFileLabel] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const resetFromItem = useCallback(() => {
    setName(item.name);
    setDescription(item.description);
    setPrice(priceCentsToInput(item.price_cents));
    setImageUrl(item.image_url ?? "");
    setFile(null);
    setFileLabel(null);
    setError(null);
    setFieldErrors({});
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [item]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      resetFromItem();
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

      const result = await updateMenuItemAction(item.id, {
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
      resetFromItem();
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
        <Button type="button" variant="outline" size="sm" disabled={disabled} className="gap-1.5">
          <Pencil className="size-3.5 shrink-0" aria-hidden />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[min(90vh,640px)] overflow-y-auto sm:max-w-lg" showCloseButton>
        <DialogHeader>
          <DialogTitle>Edit menu item</DialogTitle>
          <DialogDescription>
            Update name, description, price, or photo. Changes appear on the public menu after you save.
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
              disabled={submitting}
            />
            {fieldErrors.description ? (
              <p className="text-xs text-destructive" role="alert">
                {fieldErrors.description}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${formId}-price`}>{menuPriceFieldLabel()}</Label>
            <Input
              id={`${formId}-price`}
              value={price}
              onChange={(ev) => setPrice(ev.target.value)}
              type="text"
              inputMode="decimal"
              placeholder="120"
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
              "Save changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
