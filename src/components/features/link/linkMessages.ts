import { LinkError } from "@/lib/link";

/** Turns a link error into a sentence a parent or a child can act on. Never technical. */
export function describeLinkError(error: unknown, side: "parent" | "child"): string {
  if (error instanceof LinkError) {
    switch (error.code) {
      case "not-a-code":
        return side === "child"
          ? "That is not a code from your parents' phone. Ask them to open Family link."
          : "That is not a code from this app.";
      case "wrong-version":
        return "That code comes from another version of the app. Update both phones and try again.";
      case "incomplete":
        return "Some parts are still missing. Keep scanning.";
      case "wrong-family":
        return "This code is not from your family, or the scan was damaged. Try again.";
      case "corrupt":
        return "The code could not be read. Try again with more light.";
      case "unsupported":
        return "This phone cannot read that code yet. Try updating the browser or paste the text instead.";
    }
  }
  return "Something went wrong while reading the code. Try again.";
}
