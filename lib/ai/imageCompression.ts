"use client";

/**
 * Compresses an image in the browser/WebView before base64 encoding.
 * The bounded dimensions and output size reduce memory pressure on 32-bit ARM devices.
 */
export async function compressNaraImage(
  file: File,
  maxDimension = 1280,
  maxBytes = 1_200_000
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Choose an image file.");
  }
  if (file.size > 12_000_000) {
    throw new Error("The original image is too large. Choose an image under 12 MB.");
  }

  let bitmap: ImageBitmap | null = null;
  let objectUrl: string | null = null;

  try {
    if (typeof createImageBitmap === "function") {
      bitmap = await createImageBitmap(file);
    }

    let source: CanvasImageSource;
    let sourceWidth: number;
    let sourceHeight: number;

    if (bitmap) {
      source = bitmap;
      sourceWidth = bitmap.width;
      sourceHeight = bitmap.height;
    } else {
      objectUrl = URL.createObjectURL(file);
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const element = new Image();
        element.onload = () => resolve(element);
        element.onerror = () => reject(new Error("The image could not be decoded."));
        element.src = objectUrl as string;
      });
      source = image;
      sourceWidth = image.naturalWidth;
      sourceHeight = image.naturalHeight;
    }

    if (!sourceWidth || !sourceHeight) {
      throw new Error("The image has invalid dimensions.");
    }

    let dimension = Math.min(maxDimension, Math.max(sourceWidth, sourceHeight));
    let blob: Blob | null = null;

    // Try a small bounded quality/dimension ladder rather than keeping multiple
    // full-resolution bitmap copies in memory.
    for (let dimensionAttempt = 0; dimensionAttempt < 2; dimensionAttempt += 1) {
      const scale = Math.min(1, dimension / Math.max(sourceWidth, sourceHeight));
      const width = Math.max(1, Math.round(sourceWidth * scale));
      const height = Math.max(1, Math.round(sourceHeight * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d", { alpha: false });
      if (!context) throw new Error("Image compression is unavailable in this browser.");
      context.drawImage(source, 0, 0, width, height);

      for (const quality of [0.78, 0.68, 0.58, 0.5]) {
        blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob(resolve, "image/jpeg", quality);
        });
        if (blob && blob.size <= maxBytes) break;
      }
      canvas.width = 1;
      canvas.height = 1;

      if (blob && blob.size <= maxBytes) break;
      dimension = 960;
    }

    if (!blob || blob.size > maxBytes) {
      throw new Error("The compressed image is still too large. Choose a smaller screenshot.");
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") resolve(reader.result);
        else reject(new Error("Could not encode the image."));
      };
      reader.onerror = () => reject(new Error("Could not read the compressed image."));
      reader.readAsDataURL(blob as Blob);
    });

    return dataUrl;
  } finally {
    bitmap?.close();
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
}
