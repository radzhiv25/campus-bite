"use client";

import { Camera, ImageUp, Loader2, RotateCcw, ScanLine } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { scanStudentIdAction, type IdScanResult } from "@/lib/id-scan/actions";
import { logIdScanError, logIdScanResult } from "@/lib/id-scan/log-scan";
import { ID_SCAN_ACCEPT } from "@/lib/id-scan/validate-image";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type StudentIdScannerProps = {
  onScanComplete: (result: IdScanResult) => void;
  disabled?: boolean;
  className?: string;
};

export function StudentIdScanner({ onScanComplete, disabled, className }: StudentIdScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<"camera" | "upload">("camera");
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraReady(false);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    stopCamera();
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera is not available in this browser. Use upload instead.");
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
      setCameraError("Could not access the camera. Allow permission or upload a photo instead.");
    }
  }, [stopCamera]);

  useEffect(() => {
    if (mode === "camera") {
      void startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [mode, startCamera, stopCamera]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function runScan(file: File) {
    setScanning(true);
    setScanError(null);
    const formData = new FormData();
    formData.set("image", file);
    const result = await scanStudentIdAction(formData);
    setScanning(false);
    if (!result.ok) {
      logIdScanError(result.error, { fileName: file.name });
      setScanError(result.error);
      return;
    }
    logIdScanResult(result.data, { fileName: file.name, fileSize: file.size });
    onScanComplete(result.data);
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
    await runScan(new File([blob], "id-capture.jpg", { type: "image/jpeg" }));
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    await runScan(file);
  }

  function clearPreview() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setScanError(null);
  }

  return (
    <div className={cn("space-y-3 rounded-xl border border-border bg-muted/20 p-4", className)}>
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <ScanLine className="size-4 shrink-0" aria-hidden />
          Scan campus ID (optional)
        </div>
        <p className="text-xs text-muted-foreground">
          Pre-fill your name and enrollment number from a photo. We process the image once and do not store it. Review every
          field before continuing.
        </p>
      </div>

      <Tabs
        value={mode}
        onValueChange={(v) => {
          clearPreview();
          setScanError(null);
          setMode(v as "camera" | "upload");
        }}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="camera" disabled={disabled || scanning} className="gap-1.5">
            <Camera className="size-3.5" aria-hidden />
            Webcam
          </TabsTrigger>
          <TabsTrigger value="upload" disabled={disabled || scanning} className="gap-1.5">
            <ImageUp className="size-3.5" aria-hidden />
            Upload
          </TabsTrigger>
        </TabsList>

        <TabsContent value="camera" className="mt-3 space-y-3">
          {cameraError ? (
            <p className="text-xs text-destructive" role="alert">
              {cameraError}
            </p>
          ) : null}
          <div className="relative min-h-48 max-h-48 overflow-hidden rounded-lg border border-border bg-black/90 sm:max-h-56">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- local capture preview
              <img src={previewUrl} alt="Captured student ID preview" className="h-full w-full object-contain" />
            ) : (
              <video
                ref={videoRef}
                className="h-full w-full scale-x-[-1] object-cover"
                playsInline
                muted
                aria-label="Webcam preview for student ID"
              />
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              disabled={disabled || scanning || !cameraReady}
              onClick={() => void captureFromCamera()}
              className="gap-1.5"
            >
              {scanning ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                  Reading ID…
                </>
              ) : (
                <>
                  <Camera className="size-3.5" aria-hidden />
                  Capture &amp; scan
                </>
              )}
            </Button>
            {previewUrl ? (
              <Button type="button" size="sm" variant="outline" disabled={scanning} onClick={clearPreview}>
                <RotateCcw className="size-3.5" aria-hidden />
                Retake
              </Button>
            ) : null}
          </div>
        </TabsContent>

        <TabsContent value="upload" className="mt-3 space-y-3">
          {previewUrl ? (
            <div className="relative min-h-48 max-h-48 overflow-hidden rounded-lg border border-border bg-muted sm:max-h-56">
              {/* eslint-disable-next-line @next/next/no-img-element -- local file preview */}
              <img src={previewUrl} alt="Uploaded student ID preview" className="h-full w-full object-contain" />
            </div>
          ) : null}
          <p className="text-xs text-muted-foreground">
            No webcam? Upload a photo from your laptop or phone (JPEG, PNG, or WebP).
          </p>
          <div className="space-y-2">
            <Label htmlFor="id-card-upload" className="sr-only">
              Upload student ID photo
            </Label>
            <input
              ref={fileInputRef}
              id="id-card-upload"
              type="file"
              accept={ID_SCAN_ACCEPT}
              capture="environment"
              className="hidden"
              disabled={disabled || scanning}
              onChange={(e) => void handleFileChange(e)}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled || scanning}
              className="w-full gap-1.5"
              onClick={() => fileInputRef.current?.click()}
            >
              {scanning ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                  Reading ID…
                </>
              ) : (
                <>
                  <ImageUp className="size-3.5" aria-hidden />
                  Choose photo
                </>
              )}
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {scanError ? (
        <p className="text-xs text-destructive" role="alert">
          {scanError}
        </p>
      ) : null}
    </div>
  );
}
