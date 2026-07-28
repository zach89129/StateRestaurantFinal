import {
  OUTBOUND_IMAGE_JPEG_QUALITY,
  OUTBOUND_IMAGE_MAX_DIMENSION,
} from "./constants";
import { isAllowedOutboundShipmentImage } from "./imageValidation";

function toJpegFileName(originalName: string): string {
  const base = originalName.replace(/\.[^/.]+$/, "").trim() || "image";
  return `${base}.jpg`;
}

export async function compressOutboundShipmentImage(file: File): Promise<File> {
  if (!isAllowedOutboundShipmentImage(file)) {
    throw new Error("Only non-SVG image files are allowed");
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error(
      `Could not process "${file.name}". Try a JPG or PNG photo instead.`
    );
  }

  try {
    const scale = Math.min(
      1,
      OUTBOUND_IMAGE_MAX_DIMENSION / Math.max(bitmap.width, bitmap.height)
    );
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Could not compress image");
    }

    context.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (!result) {
            reject(new Error("Could not compress image"));
            return;
          }
          resolve(result);
        },
        "image/jpeg",
        OUTBOUND_IMAGE_JPEG_QUALITY
      );
    });

    return new File([blob], toJpegFileName(file.name), {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } finally {
    bitmap.close();
  }
}

export async function compressOutboundShipmentImages(
  files: File[]
): Promise<File[]> {
  const compressed: File[] = [];
  for (const file of files) {
    compressed.push(await compressOutboundShipmentImage(file));
  }
  return compressed;
}
