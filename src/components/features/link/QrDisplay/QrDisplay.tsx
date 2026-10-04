"use client";

import { useEffect, useState } from "react";
import { toDataURL } from "qrcode";
import { Button, Text } from "@/components/ui";
import {
  Caption,
  CodeFrame,
  CodeImage,
  DisplayContainer,
  Dot,
  Dots,
  FrameControls,
} from "./QrDisplay.style";

/** Time each frame stays on screen when a code has several frames and auto-play is on. */
const AUTO_ADVANCE_MS = 2500;

type QrDisplayProps = {
  /** One text per QR code. Several frames are shown one after another. */
  frames: string[];
  /** Describes the code for screen readers, e.g. "Pairing code". */
  label: string;
};

export function QrDisplay({ frames, label }: QrDisplayProps) {
  // The rendered images are kept together with the frames they belong to, so a new `frames` prop
  // shows "Drawing..." instead of a stale code while the new one is being drawn.
  const [rendered, setRendered] = useState<{ frames: string[]; urls: string[] } | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [current, setCurrent] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    let isCancelled = false;
    Promise.all(
      frames.map((frame) => toDataURL(frame, { errorCorrectionLevel: "M", margin: 1, scale: 6 })),
    )
      .then((urls) => {
        if (!isCancelled) {
          setRendered({ frames, urls });
          setRenderError(null);
          setCurrent(0);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setRenderError("This code could not be drawn. Try a shorter range.");
        }
      });
    return () => {
      isCancelled = true;
    };
  }, [frames]);

  const images = rendered && rendered.frames === frames ? rendered.urls : [];

  useEffect(() => {
    if (!isAutoPlaying || frames.length < 2) {
      return;
    }
    const id = setInterval(() => {
      setCurrent((index) => (index + 1) % frames.length);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(id);
  }, [isAutoPlaying, frames.length]);

  if (renderError) {
    return <Text tone="urgent">{renderError}</Text>;
  }

  const total = frames.length;
  const hasMany = total > 1;
  const caption = hasMany ? `${label}: part ${current + 1} of ${total}` : label;

  return (
    <DisplayContainer aria-label={label}>
      <CodeFrame>
        {images[current] ? (
          <CodeImage src={images[current]} alt={caption} />
        ) : (
          <Text tone="muted">Drawing the code...</Text>
        )}
      </CodeFrame>
      <Caption aria-live="polite">{caption}</Caption>
      {hasMany ? (
        <>
          <Dots aria-hidden="true">
            {frames.map((frame, index) => (
              <Dot key={frame.slice(0, 16)} $isCurrent={index === current} />
            ))}
          </Dots>
          <FrameControls>
            <Button
              variant="secondary"
              fullWidth
              onClick={() => {
                setIsAutoPlaying(false);
                setCurrent((index) => (index - 1 + total) % total);
              }}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              fullWidth
              aria-pressed={isAutoPlaying}
              onClick={() => setIsAutoPlaying((value) => !value)}
            >
              {isAutoPlaying ? "Pause" : "Auto"}
            </Button>
            <Button
              variant="secondary"
              fullWidth
              onClick={() => {
                setIsAutoPlaying(false);
                setCurrent((index) => (index + 1) % total);
              }}
            >
              Next
            </Button>
          </FrameControls>
        </>
      ) : null}
    </DisplayContainer>
  );
}
