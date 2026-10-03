"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { CloseButton, DialogBody, DialogTitle, StyledDialog } from "./Dialog.style";

type DialogProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  closeLabel?: string;
  children: ReactNode;
};

// A modal dialog built on the native <dialog> element: focus is trapped and Escape closes it.
export function Dialog({ open, title, onClose, closeLabel = "Close", children }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const element = dialogRef.current;
    if (!element) return;
    if (open && !element.open) {
      if (typeof element.showModal === "function") element.showModal();
      else element.setAttribute("open", "");
    } else if (!open && element.open) {
      if (typeof element.close === "function") element.close();
      else element.removeAttribute("open");
    }
  }, [open]);

  return (
    <StyledDialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        // Let the parent state decide: keep the dialog in sync with `open`.
        event.preventDefault();
        onClose();
      }}
    >
      <DialogTitle id={titleId}>{title}</DialogTitle>
      <DialogBody>{children}</DialogBody>
      <CloseButton type="button" onClick={onClose}>
        {closeLabel}
      </CloseButton>
    </StyledDialog>
  );
}
