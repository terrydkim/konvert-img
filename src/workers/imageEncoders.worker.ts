/**
 * 워커 전용 이미지 인코더
 * - document 사용 불가 → WASM만 사용
 * - 메인 스레드의 encodeImage와 다름
 */

import type { ImageSettings } from "../types/types";
import { ImageEncodingError } from "../types/errors";

// WASM 인코더 (lazy load)
let wasmWebpEncoder: typeof import("@jsquash/webp").encode | null = null;
let wasmJpegEncoder: typeof import("@jsquash/jpeg").encode | null = null;
let wasmPngEncoder: typeof import("@jsquash/png").encode | null = null;
let wasmOxipngOptimizer: typeof import("@jsquash/oxipng").optimise | null =
  null;

const DEFAULT_QUALITY = 80;

/**
 * WASM을 사용한 WebP 인코딩
 */
async function encodeWebPWithWasm(
  imageData: ImageData,
  quality: number
): Promise<Blob> {
  try {
    if (!wasmWebpEncoder) {
      const module = await import("@jsquash/webp");
      wasmWebpEncoder = module.encode;
    }

    const encoded = await wasmWebpEncoder(imageData, {
      quality: Math.max(1, Math.min(100, quality)),
      method: 6,
      lossless: 0,
      near_lossless: 0,
    });

    return new Blob([encoded], { type: "image/webp" });
  } catch (error) {
    throw new ImageEncodingError(
      "WebP WASM 인코딩 중 오류 발생",
      "ENCODING_FAILED",
      error
    );
  }
}

/**
 * WASM을 사용한 JPEG 인코딩 (MozJPEG)
 */
async function encodeJPEGWithWasm(
  imageData: ImageData,
  quality: number
): Promise<Blob> {
  try {
    if (!wasmJpegEncoder) {
      const module = await import("@jsquash/jpeg");
      wasmJpegEncoder = module.encode;
    }

    const encoded = await wasmJpegEncoder(imageData, { quality });
    return new Blob([encoded], { type: "image/jpeg" });
  } catch (error) {
    throw new ImageEncodingError(
      "JPEG WASM 인코딩 중 오류 발생",
      "ENCODING_FAILED",
      error
    );
  }
}

/**
 * WASM을 사용한 PNG 인코딩 + OxiPNG 최적화
 */
async function encodePNGWithWasm(imageData: ImageData): Promise<Blob> {
  try {
    if (!wasmPngEncoder) {
      const module = await import("@jsquash/png");
      wasmPngEncoder = module.encode;
    }

    if (!wasmOxipngOptimizer) {
      const module = await import("@jsquash/oxipng");
      wasmOxipngOptimizer = module.optimise;
    }

    const encoded = await wasmPngEncoder(imageData);
    const optimised = await wasmOxipngOptimizer(encoded, { level: 2 });
    return new Blob([optimised], { type: "image/png" });
  } catch (error) {
    throw new ImageEncodingError(
      "PNG WASM 인코딩 중 오류 발생",
      "ENCODING_FAILED",
      error
    );
  }
}

/**
 * 워커 전용 통합 인코더 (WASM만 사용)
 */
export async function encodeImageInWorker(
  imageData: ImageData,
  targetExtension: string,
  settings?: ImageSettings
): Promise<Blob> {
  const quality = settings?.quality ?? DEFAULT_QUALITY;

  switch (targetExtension) {
    case "webp":
      return encodeWebPWithWasm(imageData, quality);

    case "jpg":
      return encodeJPEGWithWasm(imageData, quality);

    case "png":
      return encodePNGWithWasm(imageData);

    default:
      throw new ImageEncodingError(
        `지원하지 않는 확장자입니다: ${targetExtension}`,
        "UNSUPPORTED_FORMAT"
      );
  }
}
