// Optional raw DEFLATE through the Compression Streams API. Smaller payloads mean fewer, lighter QR
// frames. When the API is missing (old browsers, some test runners) the codec falls back to plain bytes
// and says so in its flags byte, so the receiver never has to guess.

type StreamCtor = new (format: "deflate-raw") => {
  readable: ReadableStream;
  writable: WritableStream;
};

let compressionProbe: boolean | null = null;

function tryCompressionCtor(): StreamCtor | null {
  const Ctor = (globalThis as { CompressionStream?: StreamCtor }).CompressionStream;
  if (typeof Ctor !== "function") {
    return null;
  }
  try {
    new Ctor("deflate-raw");
    return Ctor;
  } catch {
    return null;
  }
}

function compressionCtor(): StreamCtor | null {
  return tryCompressionCtor();
}

function decompressionCtor(): StreamCtor | null {
  const Ctor = (globalThis as { DecompressionStream?: StreamCtor }).DecompressionStream;
  if (typeof Ctor !== "function") {
    return null;
  }
  try {
    new Ctor("deflate-raw");
    return Ctor;
  } catch {
    return null;
  }
}

export function isCompressionAvailable(): boolean {
  if (compressionProbe === null) {
    compressionProbe = compressionCtor() !== null && decompressionCtor() !== null;
  }
  return compressionProbe;
}

async function pipe(bytes: Uint8Array, Ctor: StreamCtor): Promise<Uint8Array> {
  const stream = new Ctor("deflate-raw");
  const writer = stream.writable.getWriter();
  await writer.write(bytes.slice());
  await writer.close();
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
