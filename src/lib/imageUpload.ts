// Per-image quality budget. Kept high so uploads stay crisp; the combined cap
// below is the real limit and prepareImageUploads shrinks this per image only
// when several are uploaded at once.
export const TARGET_IMAGE_BYTES = Math.floor(1.6 * 1024 * 1024);
// Total across all images in one save. Stays under the serverless request-body
// limit (~4.5MB) with headroom for multipart boundaries and other form fields.
export const MAX_COMBINED_UPLOAD_BYTES = Math.floor(4 * 1024 * 1024);

// Preserve real resolution — only downscale images larger than this.
const MAX_IMAGE_DIMENSION = 3000;
const MIN_IMAGE_DIMENSION = 480;
// Quality ladder biased toward high fidelity; we stop as soon as the image
// fits its byte budget, so most images keep the top qualities.
const JPEG_QUALITIES = [0.95, 0.92, 0.88, 0.84, 0.78, 0.72, 0.64];

export class ImageCompressionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageCompressionError";
  }
}

const jpegName = (name: string) => {
  const base = name.replace(/\.[^.]+$/, "").trim() || "image";
  return `${base}.jpg`;
};

const loadImage = (file: File) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new ImageCompressionError(`Could not read ${file.name} as an image.`));
    };
    image.src = objectUrl;
  });

const canvasToJpeg = (canvas: HTMLCanvasElement, quality: number) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new ImageCompressionError("The browser could not create a JPEG image."));
      },
      "image/jpeg",
      quality
    );
  });

export async function compressImageForUpload(
  file: File,
  targetBytes: number = TARGET_IMAGE_BYTES
): Promise<File> {
  if (!file.type.startsWith("image/")) {
    throw new ImageCompressionError(`${file.name} is not an image.`);
  }

  // Already a JPEG within budget — keep the original bytes untouched (best quality).
  if (file.type === "image/jpeg" && file.size <= targetBytes) {
    return file;
  }

  try {
    const image = await loadImage(file);
    if (!image.naturalWidth || !image.naturalHeight) {
      throw new ImageCompressionError(`${file.name} has invalid dimensions.`);
    }

    const initialScale = Math.min(
      1,
      MAX_IMAGE_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight)
    );
    let width = Math.max(1, Math.round(image.naturalWidth * initialScale));
    let height = Math.max(1, Math.round(image.naturalHeight * initialScale));
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) {
      throw new ImageCompressionError("Image compression is unavailable in this browser.");
    }

    let smallestBlob: Blob | null = null;
    for (let resizeAttempt = 0; resizeAttempt < 7; resizeAttempt += 1) {
      canvas.width = width;
      canvas.height = height;
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);

      for (const quality of JPEG_QUALITIES) {
        const blob = await canvasToJpeg(canvas, quality);
        if (!smallestBlob || blob.size < smallestBlob.size) smallestBlob = blob;
        if (blob.size <= targetBytes) {
          return new File([blob], jpegName(file.name), {
            type: "image/jpeg",
            lastModified: Date.now(),
          });
        }
      }

      if (width <= MIN_IMAGE_DIMENSION && height <= MIN_IMAGE_DIMENSION) break;
      width = Math.max(MIN_IMAGE_DIMENSION, Math.round(width * 0.78));
      height = Math.max(MIN_IMAGE_DIMENSION, Math.round(height * 0.78));
    }

    const size = smallestBlob ? Math.ceil(smallestBlob.size / 1024) : "unknown";
    const targetKb = Math.round(targetBytes / 1024);
    throw new ImageCompressionError(
      `${file.name} could not be compressed below ${targetKb} KB (best result: ${size} KB).`
    );
  } catch (error) {
    if (error instanceof ImageCompressionError) throw error;
    throw new ImageCompressionError(
      `Compression failed for ${file.name}. Try a JPG, PNG, or WebP image.`
    );
  }
}

export async function prepareImageUploads(
  files: File[],
  { maxFiles = 8 }: { maxFiles?: number } = {}
): Promise<File[]> {
  if (files.length > maxFiles) {
    throw new ImageCompressionError(`You can upload up to ${maxFiles} images at once.`);
  }

  // Give each image the largest byte budget it can have while the whole batch
  // still fits under the combined cap: full quality for one or two images,
  // gracefully tightening only when many are uploaded together.
  const perImageBudget = Math.min(
    TARGET_IMAGE_BYTES,
    Math.floor(MAX_COMBINED_UPLOAD_BYTES / Math.max(1, files.length))
  );

  const compressed: File[] = [];
  for (const file of files) {
    compressed.push(await compressImageForUpload(file, perImageBudget));
  }

  const combinedBytes = compressed.reduce((total, file) => total + file.size, 0);
  if (combinedBytes > MAX_COMBINED_UPLOAD_BYTES) {
    throw new ImageCompressionError(
      "The compressed images are still too large together. Remove one or more images and try again."
    );
  }

  return compressed;
}
