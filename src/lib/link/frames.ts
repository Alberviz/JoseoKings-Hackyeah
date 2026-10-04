// A payload that does not fit in one scannable QR is split into numbered frames: "CCD1:2/3:<chunk>".
// The receiver collects frames in any order and joins them when the set is complete. Scanning the
// same frame twice is harmless.

import { APP_NAME } from "@/config/app";
import { LinkError } from "./types";

/** Characters per frame body. Phones scan QR codes of this size reliably; bigger ones often fail. */
export const DEFAULT_FRAME_CHARS = 600;
/** Upper bound so a collector cannot be tricked into holding unbounded memory. */
export const MAX_FRAME_COUNT = 64;
/** Longest chunk we accept from a scanned frame string. */
export const MAX_FRAME_CHUNK_CHARS = 1000;

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
  if (total > MAX_FRAME_COUNT) {
    throw new LinkError("corrupt", "The code is too large to scan safely.");
  }
  const frames: string[] = [];
  for (let i = 0; i < total; i += 1) {
    frames.push(`${prefix}${i + 1}/${total}:${body.slice(i * maxChars, (i + 1) * maxChars)}`);
  }
  return frames;
}

export function parseFrame(text: string): Frame {
  const match = FRAME_PATTERN.exec(text.trim());
  if (!match) throw new LinkError("not-a-code", `This is not a ${APP_NAME} code.`);
  const index = Number(match[2]);
  const total = Number(match[3]);
  if (index < 1 || total < 1 || index > total || total > MAX_FRAME_COUNT) {
    throw new LinkError("corrupt", "The frame numbers do not make sense.");
  }
  const chunk = match[4];
  if (chunk.length > MAX_FRAME_CHUNK_CHARS) {
    throw new LinkError("corrupt", "The frame chunk is too long.");
  }
  return { prefix: match[1], index, total, chunk };
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
    const previous = this.chunks.get(frame.index);
    if (previous !== undefined && previous !== frame.chunk) {
      throw new LinkError("corrupt", "Two different parts had the same number.");
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

  /** The complete frames in order, rebuilt as scanned text. Throws while frames are missing. */
  frames(): string[] {
    if (!this.isComplete() || this.prefix === null || this.total === null) {
      throw new LinkError("incomplete", "Some frames are still missing.");
    }
    const list: string[] = [];
    for (let i = 1; i <= this.total; i += 1) {
      list.push(`${this.prefix}${i}/${this.total}:${this.chunks.get(i) ?? ""}`);
    }
    return list;
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
