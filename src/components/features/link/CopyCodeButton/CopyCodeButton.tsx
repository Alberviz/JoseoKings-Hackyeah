"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui";

type CopyCodeButtonProps = {
  /** The frames to copy, one per line. The other phone pastes them in its scanner. */
  frames: string[];
};

const RESET_MS = 2000;

/** Fallback for phones whose camera cannot read the screen: copy the code as text and send it. */
export function CopyCodeButton({ frames }: CopyCodeButtonProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    if (status === "idle") {
      return;
    }
    const id = setTimeout(() => setStatus("idle"), RESET_MS);
    return () => clearTimeout(id);
  }, [status]);

  const canCopy = typeof navigator !== "undefined" && Boolean(navigator.clipboard);

  if (!canCopy) {
    return null;
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(frames.join("\n"));
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
  };

  return (
    <Button variant="secondary" fullWidth onClick={copy} aria-live="polite">
      {status === "copied"
        ? "Copied"
        : status === "failed"
          ? "Could not copy"
          : "Copy code as text"}
    </Button>
  );
}
