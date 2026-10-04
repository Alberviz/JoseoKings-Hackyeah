"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ChangeEvent,
  type FormEvent,
} from "react";
import jsQR from "jsqr";
import { Button, Text, TextField } from "@/components/ui";
import {
  CameraVideo,
  FileLabel,
  HiddenCanvas,
  HiddenFileInput,
  ModeTab,
  ModeTabs,
  PasteForm,
  ScannerContainer,
  StatusLine,
  Viewfinder,
  ViewfinderGuide,
} from "./QrScanner.style";

export type ScanFeedback = {
  tone: "default" | "success" | "urgent";
  message: string;
};

type ScanMode = "camera" | "photo" | "paste";

type QrScannerProps = {
  /** Called once per decoded code. The same code is not repeated within a short window. */
  onCode: (text: string) => void;
  /** What the caller wants to say about the last code (e.g. "Part 2 of 3 received"). */
  feedback?: ScanFeedback;
  /** Short line under the viewfinder telling the person what to point at. */
  hint: string;
};

/** How often a camera frame is analysed. Lower is faster to scan, but costs battery. */
const CAMERA_SCAN_INTERVAL_MS = 150;
/** The same text is reported again only after this time, so a steady camera does not spam. */
const REPEAT_WINDOW_MS = 1500;
/** Photos are downscaled to this many pixels on the long side before decoding. */
const PHOTO_MAX_SIDE = 1200;

function canUseCamera(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.mediaDevices !== "undefined" &&
    typeof navigator.mediaDevices.getUserMedia === "function" &&
    typeof window !== "undefined" &&
    window.isSecureContext
  );
}

const noSubscription = () => () => {};

/** True on the client when a camera can be asked for; false on the server and in insecure pages. */
function useCameraAvailable(): boolean {
  return useSyncExternalStore(noSubscription, canUseCamera, () => false);
}

function decodeImageData(data: ImageData): string | null {
  const result = jsQR(data.data, data.width, data.height, { inversionAttempts: "dontInvert" });
  return result && result.data ? result.data : null;
}

export function QrScanner({ onCode, feedback, hint }: QrScannerProps) {
  const cameraAvailable = useCameraAvailable();
  // null means "not chosen yet": camera when there is one, otherwise photo.
  const [chosenMode, setMode] = useState<ScanMode | null>(null);
  const mode: ScanMode = chosenMode ?? (cameraAvailable ? "camera" : "photo");
  const [deviceStatus, setDeviceStatus] = useState<ScanFeedback | null>(null);
  const [pastedText, setPastedText] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastReport = useRef<{ text: string; at: number } | null>(null);
  // Kept in a ref so a new callback from the parent does not restart the camera.
  const onCodeRef = useRef(onCode);
  useEffect(() => {
    onCodeRef.current = onCode;
  }, [onCode]);

  const report = useCallback((text: string) => {
    const now = Date.now();
    const last = lastReport.current;
    if (last && last.text === text && now - last.at < REPEAT_WINDOW_MS) {
      return;
    }
    lastReport.current = { text, at: now };
    onCodeRef.current(text);
  }, []);

  useEffect(() => {
    if (mode !== "camera") {
      return;
    }
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) {
      return;
    }
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setInterval> | null = null;
    let isCancelled = false;

    const scanFrame = () => {
      if (video.readyState < video.HAVE_ENOUGH_DATA) {
        return;
      }
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) {
        return;
      }
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const text = decodeImageData(context.getImageData(0, 0, canvas.width, canvas.height));
      if (text) {
        report(text);
      }
    };

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false })
      .then((mediaStream) => {
        if (isCancelled) {
          mediaStream.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = mediaStream;
        video.srcObject = mediaStream;
        return video.play().then(() => {
          setDeviceStatus({
            tone: "default",
            message: "Camera on. Hold the code inside the frame.",
          });
          timer = setInterval(scanFrame, CAMERA_SCAN_INTERVAL_MS);
        });
      })
      .catch(() => {
        if (!isCancelled) {
          setDeviceStatus({
            tone: "urgent",
            message: "The camera is not available. Use a photo or paste the code instead.",
          });
        }
      });

    return () => {
      isCancelled = true;
      if (timer) {
        clearInterval(timer);
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      video.srcObject = null;
    };
  }, [mode, report]);

  const handlePhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { willReadFrequently: true });
    if (!canvas || !context) {
      return;
    }
    setDeviceStatus({ tone: "default", message: "Reading the photo..." });
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, PHOTO_MAX_SIDE / Math.max(bitmap.width, bitmap.height));
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      const text = decodeImageData(context.getImageData(0, 0, canvas.width, canvas.height));
      if (text) {
        setDeviceStatus(null);
        report(text);
      } else {
        setDeviceStatus({
          tone: "urgent",
          message: "No code found in that photo. Try closer, with the whole square visible.",
        });
      }
    } catch {
      setDeviceStatus({ tone: "urgent", message: "That image could not be read." });
    }
  };

  const handlePaste = (event: FormEvent) => {
    event.preventDefault();
    const tokens = pastedText.split(/\s+/).filter((token) => token.length > 0);
    if (tokens.length === 0) {
      setDeviceStatus({ tone: "urgent", message: "Paste the code text first." });
      return;
    }
    setDeviceStatus(null);
    tokens.forEach((token) => onCodeRef.current(token));
    setPastedText("");
  };

  const status = deviceStatus ?? feedback ?? null;

  return (
    <ScannerContainer aria-label="Code scanner">
      <ModeTabs role="tablist" aria-label="How to read the code">
        <ModeTab
          type="button"
          role="tab"
          aria-selected={mode === "camera"}
          $isActive={mode === "camera"}
          disabled={!cameraAvailable}
          onClick={() => setMode("camera")}
        >
          Camera
        </ModeTab>
        <ModeTab
          type="button"
          role="tab"
          aria-selected={mode === "photo"}
          $isActive={mode === "photo"}
          onClick={() => setMode("photo")}
        >
          Photo
        </ModeTab>
        <ModeTab
          type="button"
          role="tab"
          aria-selected={mode === "paste"}
          $isActive={mode === "paste"}
          onClick={() => setMode("paste")}
        >
          Paste
        </ModeTab>
      </ModeTabs>

      {mode === "camera" ? (
        <Viewfinder>
          <CameraVideo ref={videoRef} muted playsInline aria-label="Camera preview" />
          <ViewfinderGuide aria-hidden="true" />
        </Viewfinder>
      ) : null}

      {mode === "photo" ? (
        <FileLabel>
          Take or choose a photo of the code
          <HiddenFileInput
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhoto}
          />
        </FileLabel>
      ) : null}

      {mode === "paste" ? (
        <PasteForm onSubmit={handlePaste}>
          <TextField
            label="Code text"
            multiline
            rows={4}
            value={pastedText}
            onChange={setPastedText}
            hint="Paste the text copied from the other phone. Several parts can go together."
          />
          <Button type="submit" variant="primary">
            Read pasted code
          </Button>
        </PasteForm>
      ) : null}

      <HiddenCanvas ref={canvasRef} aria-hidden="true" />

      <Text size="sm" tone="muted">
        {hint}
      </Text>
      <StatusLine role="status" aria-live="polite" $tone={status?.tone ?? "default"}>
        {status?.message ?? ""}
      </StatusLine>
    </ScannerContainer>
  );
}
