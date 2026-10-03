// A payload that does not fit in one scannable QR is split into numbered frames: "CCD1:2/3:<chunk>".
// The receiver collects frames in any order and joins them when the set is complete. Scanning the
// same frame twice is harmless.

import { LinkError } from "./types";

/** Characters per frame body. Phones scan QR codes of this size reliably; bigger ones often fail. */
export const DEFAULT_FRAME_CHARS = 600;

const FRAME_PATTERN = /^([A-Z]{3}\d+:)(\d+)\/(\d+):([A-Za-z0-9_-]*)$/;

export type Frame = {
  prefix: string;
  /** 1-based. */
  index: number;
  total: number;
  chunk: string;
};

export function splitFrames(
  prefix: string,
  body: string,
  maxChars: number = DEFAULT_FRAME_CHARS,
): string[] {
  if (maxChars < 1) throw new Error("maxChars must be positive");
  const total = Math.max(1, Math.ceil(body.length / maxChars));
  const frames: string[] = [];
  for (let i = 0; i < total; i += 1) {
    frames.push(`${prefix}${i + 1}/${total}:${body.slice(i * maxChars, (i + 1) * maxChars)}`);
  }
  return frames;
}

export function parseFrame(text: string): Frame {
  const match = FRAME_PATTERN.exec(text.trim());
  if (!match) throw new LinkError("not-a-code", "This is not a CrohnCare code.");
  const index = Number(match[2]);
  const total = Number(match[3]);
  if (index < 1 || total < 1 || index > total) {
    throw new LinkError("corrupt", "The frame numbers do not make sense.");
  }
  return { prefix: match[1], index, total, chunk: match[4] };
}

/** Gathers frames of one code until all of them are present. */
export class FrameCollector {
  private readonly chunks = new Map<number, string>();
  private prefix: string | null = null;
  private total: number | null = null;

  /** Adds a frame. Returns how many frames are present and how many are needed. */
  add(text: string): { have: number; total: number; isComplete: boolean } {
    const frame = parseFrame(text);
    if (this.prefix === null || this.total === null) {
      this.prefix = frame.prefix;
      this.total = frame.total;
    } else if (frame.prefix !== this.prefix || frame.total !== this.total) {
      // A frame from a different code: start over with the new one.
      this.chunks.clear();
      this.prefix = frame.prefix;
      this.total = frame.total;
    }
    this.chunks.set(frame.index, frame.chunk);
    return { have: this.chunks.size, total: this.total, isComplete: this.isComplete() };
  }

  isComplete(): boolean {
    return this.total !== null && this.chunks.size === this.total;
  }

  /** The joined body. Throws LinkError("incomplete") while frames are missing. */
  result(): { prefix: string; body: string } {
    if (!this.isComplete() || this.prefix === null || this.total === null) {
      throw new LinkError("incomplete", "Some frames are still missing.");
    }
    let body = "";
    for (let i = 1; i <= this.total; i += 1) body += this.chunks.get(i) ?? "";
    return { prefix: this.prefix, body };
  }

  reset(): void {
    this.chunks.clear();
    this.prefix = null;
    this.total = null;
  }
}

/** Convenience for tests and for the paste fallback: join a full list of frames in one call. */
export function joinFrames(frames: string[]): { prefix: string; body: string } {
  const collector = new FrameCollector();
  for (const frame of frames) collector.add(frame);
  return collector.result();
}
