// Optional raw DEFLATE through the Compression Streams API. Smaller payloads mean fewer, lighter QR
// frames. When the API is missing (old browsers, some test runners) the codec falls back to plain bytes
// and says so in its flags byte, so the receiver never has to guess.

type StreamCtor = new (format: "deflate-raw") => {
  readable: ReadableStream;
  writable: WritableStream;
};

function compressionCtor(): StreamCtor | null {
  const ctor = (globalThis as { CompressionStream?: StreamCtor }).CompressionStream;
  return typeof ctor === "function" ? ctor : null;
}

function decompressionCtor(): StreamCtor | null {
  const ctor = (globalThis as { DecompressionStream?: StreamCtor }).DecompressionStream;
  return typeof ctor === "function" ? ctor : null;
}

export function isCompressionAvailable(): boolean {
  return compressionCtor() !== null && decompressionCtor() !== null;
}

async function pipe(bytes: Uint8Array, Ctor: StreamCtor): Promise<Uint8Array> {
  const stream = new Ctor("deflate-raw");
  const writer = stream.writable.getWriter();
  void writer.write(bytes.slice());
  void writer.close();
  const buffer = await new Response(stream.readable).arrayBuffer();
  return new Uint8Array(buffer);
}

export async function deflate(bytes: Uint8Array): Promise<Uint8Array> {
  const Ctor = compressionCtor();
  if (!Ctor) throw new Error("CompressionStream is not available");
  return pipe(bytes, Ctor);
}

export async function inflate(bytes: Uint8Array): Promise<Uint8Array> {
  const Ctor = decompressionCtor();
  if (!Ctor) throw new Error("DecompressionStream is not available");
  return pipe(bytes, Ctor);
}
