const JPEG_QUALITY = 0.85;
const MAX_DIMENSION = 2040;
const HEIC_PATTERN = /\.hei[cf]$/i;
const BROWSER_FRIENDLY_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function needsConversion(file: File): boolean {
  if (HEIC_PATTERN.test(file.name)) return true;
  if (file.type === "image/heic" || file.type === "image/heif") return true;
  if (file.type && !BROWSER_FRIENDLY_TYPES.has(file.type)) return true;
  return false;
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não foi possível processar a imagem."));
    };
    img.src = url;
  });
}

function canvasToJpegBlob(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Não foi possível converter a imagem."));
      },
      "image/jpeg",
      quality,
    );
  });
}

async function convertHeicToJpeg(file: File, quality: number): Promise<File> {
  const { default: heic2any } = await import("heic2any");
  const result = await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality,
  });
  const blob = Array.isArray(result) ? result[0] : result;
  const baseName = file.name.replace(/\.[^.]+$/, "") || "foto";
  return new File([blob], `${baseName}.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

function isHeic(file: File): boolean {
  return (
    HEIC_PATTERN.test(file.name) ||
    file.type === "image/heic" ||
    file.type === "image/heif"
  );
}

export interface PrepareImageOptions {
  maxDimension?: number;
  quality?: number;
  /** Sempre comprime e converte para JPEG (ex.: avatares). */
  forceOptimize?: boolean;
}

async function resizeToJpeg(
  file: File,
  maxDimension: number,
  quality: number,
): Promise<File> {
  const img = await loadImageFromFile(file);
  const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Não foi possível processar a imagem.");
  }

  ctx.drawImage(img, 0, 0, width, height);
  const blob = await canvasToJpegBlob(canvas, quality);

  const baseName = file.name.replace(/\.[^.]+$/, "") || "foto";
  return new File([blob], `${baseName}.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

export async function prepareImageForUpload(
  file: File,
  options: PrepareImageOptions = {},
): Promise<File> {
  const maxDimension = options.maxDimension ?? MAX_DIMENSION;
  const quality = options.quality ?? JPEG_QUALITY;
  const forceOptimize = options.forceOptimize ?? false;

  if (!forceOptimize && !needsConversion(file)) {
    return file;
  }

  if (isHeic(file)) {
    const jpeg = await convertHeicToJpeg(file, quality);
    return resizeToJpeg(jpeg, maxDimension, quality);
  }

  return resizeToJpeg(file, maxDimension, quality);
}

/** Converte HEIC e outros formatos para JPEG antes do upload. */
export async function prepareCheckinImageForUpload(file: File): Promise<File> {
  return prepareImageForUpload(file);
}
