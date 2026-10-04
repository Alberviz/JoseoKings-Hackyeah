/**
 * One-off: crop WhatsApp dragon logo, drop white background, write PWA + Next icons.
 * Run: pnpm dlx sharp-cli … or temporarily `pnpm add -D sharp` then:
 *   node scripts/generate-brand-icons.mjs <source.jpg>
 */
import { writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const sourceArg = process.argv[2];
if (!sourceArg) {
  console.error("Usage: node scripts/generate-brand-icons.mjs <source-image>");
  process.exit(1);
}

const sourcePath = resolve(sourceArg);

function makeWhiteTransparent(raw) {
  for (let i = 0; i < raw.length; i += 4) {
    const r = raw[i];
    const g = raw[i + 1];
    const b = raw[i + 2];
    if (r >= 235 && g >= 235 && b >= 235) {
      raw[i + 3] = 0;
    }
  }
  return raw;
}

async function loadProcessedSquare(size) {
  const trimmed = await sharp(sourcePath).trim({ threshold: 18 }).ensureAlpha().png().toBuffer();

  const { data, info } = await sharp(trimmed).raw().toBuffer({ resolveWithObject: true });
  const rgba = Buffer.from(data);
  makeWhiteTransparent(rgba);

  let minX = info.width;
  let minY = info.height;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const i = (y * info.width + x) * 4;
      if (rgba[i + 3] > 8) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;
  const side = Math.max(cropW, cropH);
  const padX = Math.floor((side - cropW) / 2);
  const padY = Math.floor((side - cropH) / 2);

  const square = await sharp(rgba, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .extract({ left: minX, top: minY, width: cropW, height: cropH })
    .extend({
      top: padY,
      bottom: side - cropH - padY,
      left: padX,
      right: side - cropW - padX,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  return square;
}

async function maskableFromSquare(square512) {
  const inner = Math.round(512 * 0.8);
  const logo = await sharp(square512)
    .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toBuffer();
}

const square512 = await loadProcessedSquare(512);
const square192 = await sharp(square512).resize(192, 192).png().toBuffer();
const maskable512 = await maskableFromSquare(square512);

const outputs = [
  [join(root, "public", "logo.png"), square512],
  [join(root, "public", "icons", "icon-192.png"), square192],
  [join(root, "public", "icons", "icon-512.png"), square512],
  [join(root, "public", "icons", "icon-maskable-512.png"), maskable512],
  [join(root, "src", "app", "icon.png"), square512],
  [join(root, "src", "app", "apple-icon.png"), square512],
];

for (const [path, buf] of outputs) {
  writeFileSync(path, buf);
}
