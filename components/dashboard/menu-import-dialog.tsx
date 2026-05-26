"use client";

import { Camera, FileSpreadsheet, ImageUp, Loader2, RotateCcw, ScanLine, Upload } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  MenuImportReviewTable,
  type ReviewableMenuDraft,
} from "@/components/dashboard/menu-import-review-table";
import { bulkInsertMenuItemsAction } from "@/lib/menu/bulk-actions";
import { scanMenuBoardAction } from "@/lib/menu-scan/actions";
import { parseMenuCsvText } from "@/lib/menu-scan/parse-csv";
import type { MenuDraft } from "@/lib/menu-scan/types";
import { ID_SCAN_ACCEPT } from "@/lib/id-scan/validate-image";
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
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

function draftsToReviewRows(drafts: MenuDraft[]): ReviewableMenuDraft[] {
  return drafts.map((d, i) => ({
    ...d,
    id: `draft-${i}-${d.name.slice(0, 12)}`,
    selected: true,
  }));
}

export function MenuImportDialog() {
  const router = useRouter();
  const formId = useId();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvFileRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [sourceTab, setSourceTab] = useState<"photo" | "csv">("photo");
  const [photoMode, setPhotoMode] = useState<"camera" | "upload">("upload");
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  const [csvText, setCsvText] = useState("");
  const [csvError, setCsvError] = useState<string | null>(null);

  const [reviewRows, setReviewRows] = useState<ReviewableMenuDraft[] | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const reset = useCallback(() => {
    setSourceTab("photo");
    setPhotoMode("upload");
    setCameraError(null);
    setPreviewUrl(null);
    setScanning(false);
    setScanError(null);
    setCsvText("");
    setCsvError(null);
    setReviewRows(null);
    setPublishError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (csvFileRef.current) csvFileRef.current.value = "";
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraReady(false);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    stopCamera();
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera is not available. Use upload instead.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraReady(true);
    } catch {
      setCameraError("Could not access the camera. Allow permission or upload a photo.");
    }
  }, [stopCamera]);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      stopCamera();
      reset();
    }
    setOpen(next);
  };

  function handlePhotoModeChange(mode: "camera" | "upload") {
    clearPhotoPreview();
    setScanError(null);
    setPhotoMode(mode);
    if (mode === "camera" && open && sourceTab === "photo" && !reviewRows) {
      void startCamera();
    } else {
      stopCamera();
    }
  }

  async function runMenuScan(file: File) {
    setScanning(true);
    setScanError(null);
    setPublishError(null);
    const formData = new FormData();
    formData.set("image", file);
    const result = await scanMenuBoardAction(formData);
    setScanning(false);
    if (!result.ok) {
      setScanError(result.error);
      return;
    }
    setReviewRows(draftsToReviewRows(result.data.drafts));
  }

  async function captureFromCamera() {
    const video = videoRef.current;
    if (!video || !cameraReady) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.92)
    );
    if (!blob) {
      setScanError("Could not capture the frame. Try again.");
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(blob));
    await runMenuScan(new File([blob], "menu-capture.jpg", { type: "image/jpeg" }));
  }

  async function handlePhotoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    await runMenuScan(file);
  }

  function clearPhotoPreview() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setScanError(null);
  }

  function handleParseCsv() {
    setCsvError(null);
    setPublishError(null);
    const drafts = parseMenuCsvText(csvText);
    if (drafts.length === 0) {
      setCsvError('No valid rows found. Use columns like name, price, and optional description.');
      return;
    }
    setReviewRows(draftsToReviewRows(drafts));
  }

  function handleCsvFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      setCsvText(text);
      setCsvError(null);
    };
    reader.onerror = () => setCsvError("Could not read the CSV file.");
    reader.readAsText(file);
  }

  const selectedCount = reviewRows?.filter((r) => r.selected).length ?? 0;
  const busy = scanning || isPending;

  function handlePublish() {
    if (!reviewRows) return;
    const selected = reviewRows.filter((r) => r.selected);
    if (selected.length === 0) {
      setPublishError("Select at least one row to import.");
      return;
    }

    setPublishError(null);
    startTransition(async () => {
      const result = await bulkInsertMenuItemsAction(
        selected.map((r) => ({
          name: r.name.trim(),
          price: r.price.trim(),
          ...(r.description?.trim() ? { description: r.description.trim() } : {}),
        }))
      );

      if (result.error) {
        setPublishError(result.error);
        return;
      }

      setOpen(false);
      reset();
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="gap-2">
          <Upload className="size-4 shrink-0" aria-hidden />
          Import menu
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[min(92vh,720px)] overflow-y-auto sm:max-w-2xl" showCloseButton>
        <DialogHeader>
          <DialogTitle>Import menu</DialogTitle>
          <DialogDescription>
            Scan a menu board photo or paste CSV data, review every row, then import. New items are saved as{" "}
            <span className="font-medium text-foreground">unpublished</span> — publish them from the list when ready.
          </DialogDescription>
        </DialogHeader>

        {reviewRows ? (
          <div className="space-y-4">
            <MenuImportReviewTable rows={reviewRows} onRowsChange={setReviewRows} disabled={busy} />
            {publishError ? (
              <p className="text-sm text-destructive" role="alert">
                {publishError}
              </p>
            ) : null}
          </div>
        ) : (
          <Tabs
            value={sourceTab}
            onValueChange={(v) => {
              const tab = v as "photo" | "csv";
              setSourceTab(tab);
              setScanError(null);
              setCsvError(null);
              clearPhotoPreview();
              if (tab !== "photo") stopCamera();
            }}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="photo" disabled={busy} className="gap-1.5">
                <ScanLine className="size-3.5" aria-hidden />
                From photo
              </TabsTrigger>
              <TabsTrigger value="csv" disabled={busy} className="gap-1.5">
                <FileSpreadsheet className="size-3.5" aria-hidden />
                From CSV
              </TabsTrigger>
            </TabsList>

            <TabsContent value="photo" className="mt-4 space-y-4">
              <Tabs value={photoMode} onValueChange={(v) => handlePhotoModeChange(v as "camera" | "upload")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="upload" disabled={busy} className="gap-1.5">
                    <ImageUp className="size-3.5" aria-hidden />
                    Upload
                  </TabsTrigger>
                  <TabsTrigger value="camera" disabled={busy} className="gap-1.5">
                    <Camera className="size-3.5" aria-hidden />
                    Webcam
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="upload" className="mt-3 space-y-3">
                  {previewUrl ? (
                    <div className="relative min-h-40 max-h-48 overflow-hidden rounded-lg border border-border bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element -- local preview */}
                      <img src={previewUrl} alt="Menu board preview" className="h-full w-full object-contain" />
                    </div>
                  ) : null}
                  <input
                    ref={fileInputRef}
                    id={`${formId}-menu-photo`}
                    type="file"
                    accept={ID_SCAN_ACCEPT}
                    className="hidden"
                    disabled={busy}
                    onChange={(e) => void handlePhotoFileChange(e)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-1.5"
                    disabled={busy}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {scanning ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin" aria-hidden />
                        Scanning menu…
                      </>
                    ) : (
                      <>
                        <ImageUp className="size-3.5" aria-hidden />
                        Choose menu photo
                      </>
                    )}
                  </Button>
                  {previewUrl ? (
                    <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={clearPhotoPreview}>
                      <RotateCcw className="size-3.5" aria-hidden />
                      Clear preview
                    </Button>
                  ) : null}
                </TabsContent>

                <TabsContent value="camera" className="mt-3 space-y-3">
                  {cameraError ? (
                    <p className="text-xs text-destructive" role="alert">
                      {cameraError}
                    </p>
                  ) : null}
                  <div className="relative min-h-40 max-h-48 overflow-hidden rounded-lg border border-border bg-black/90">
                    {previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- local capture
                      <img src={previewUrl} alt="Captured menu preview" className="h-full w-full object-contain" />
                    ) : (
                      <video
                        ref={videoRef}
                        className="h-full w-full scale-x-[-1] object-cover"
                        playsInline
                        muted
                        aria-label="Webcam preview for menu board"
                      />
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      disabled={busy || !cameraReady}
                      onClick={() => void captureFromCamera()}
                      className="gap-1.5"
                    >
                      {scanning ? (
                        <>
                          <Loader2 className="size-3.5 animate-spin" aria-hidden />
                          Scanning…
                        </>
                      ) : (
                        <>
                          <Camera className="size-3.5" aria-hidden />
                          Capture &amp; scan
                        </>
                      )}
                    </Button>
                    {previewUrl ? (
                      <Button type="button" size="sm" variant="outline" disabled={busy} onClick={clearPhotoPreview}>
                        Retake
                      </Button>
                    ) : null}
                  </div>
                </TabsContent>
              </Tabs>
              {scanError ? (
                <p className="text-sm text-destructive" role="alert">
                  {scanError}
                </p>
              ) : null}
            </TabsContent>

            <TabsContent value="csv" className="mt-4 space-y-3">
              <div className="space-y-2">
                <Label htmlFor={`${formId}-csv`}>CSV text</Label>
                <Textarea
                  id={`${formId}-csv`}
                  value={csvText}
                  onChange={(ev) => setCsvText(ev.target.value)}
                  rows={8}
                  placeholder={"name,price,description\nCampus bowl,120,Rice and greens\nMasala dosa,80,\n…"}
                  disabled={busy}
                  className="font-mono text-xs"
                />
              </div>
              <input
                ref={csvFileRef}
                type="file"
                accept=".csv,text/csv,text/plain"
                className="hidden"
                disabled={busy}
                onChange={handleCsvFile}
              />
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => csvFileRef.current?.click()}>
                  Load .csv file
                </Button>
                <Button type="button" size="sm" disabled={busy || !csvText.trim()} onClick={handleParseCsv}>
                  Parse &amp; review
                </Button>
              </div>
              {csvError ? (
                <p className="text-sm text-destructive" role="alert">
                  {csvError}
                </p>
              ) : null}
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter className={cn(reviewRows && "flex-col-reverse gap-2 sm:flex-row sm:justify-between")}>
          {reviewRows ? (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => {
                  setReviewRows(null);
                  setPublishError(null);
                }}
              >
                Back
              </Button>
              <Button type="button" disabled={busy || selectedCount === 0} onClick={handlePublish} className="gap-2">
                {isPending ? (
                  <>
                    <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
                    Importing…
                  </>
                ) : (
                  `Import ${selectedCount} item${selectedCount === 1 ? "" : "s"}`
                )}
              </Button>
            </>
          ) : (
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={busy}>
              Cancel
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
