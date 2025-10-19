/**
 * 이미지 인코더 유틸리티
 * - 크로스 브라우저 WebP 지원 (Safari 폴백)
 * - 네이티브 API 우선, WASM 폴백
 * - JPG vs WebP 용량 비교 및 최적 선택
 */

import type { ImageSettings } from "../types/types";

// WASM 인코더 (lazy load)
let wasmWebpEncoder: typeof import("@jsquash/webp").encode | null = null;
let wasmJpegEncoder: typeof import("@jsquash/jpeg").encode | null = null;
let wasmPngEncoder: typeof import("@jsquash/png").encode | null = null;
let wasmOxipngOptimizer: typeof import("@jsquash/oxipng").optimise | null =
  null;

// WebP 지원 여부 캐싱
let webpSupported: boolean | null = null;

/**
 * 브라우저의 네이티브 WebP 인코딩 지원 여부 감지
 */
export async function checkWebPSupport(): Promise<boolean> {
  if (webpSupported !== null) {
    return webpSupported;
  }

  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      webpSupported = false;
      resolve(false);
      return;
    }

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, 1, 1);

    canvas.toBlob(
      (blob) => {
        // Safari는 WebP를 지원하지 않으면 PNG로 폴백
        webpSupported = !!(blob && blob.type === "image/webp");
        resolve(webpSupported);
      },
      "image/webp",
      1
    );
  });
}

/**
 * Canvas toBlob을 사용한 네이티브 인코딩
 */
async function encodeWithCanvas(
  imageData: ImageData,
  mimeType: string,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      resolve(null);
      return;
    }

    ctx.putImageData(imageData, 0, 0);

    canvas.toBlob(
      (blob) => {
        // MIME 타입 검증 (Safari 폴백 감지)
        if (blob && blob.type === mimeType) {
          resolve(blob);
        } else {
          resolve(null);
        }
      },
      mimeType,
      quality / 100 // Canvas는 0-1 범위
    );
  });
}

/**
 * WASM을 사용한 WebP 인코딩 (lazy load)
 */
async function encodeWebPWithWasm(
  imageData: ImageData,
  quality: number
): Promise<Blob> {
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
}

/**
 * WASM을 사용한 JPEG 인코딩 (MozJPEG)
 */
async function encodeJPEGWithWasm(
  imageData: ImageData,
  quality: number
): Promise<Blob> {
  if (!wasmJpegEncoder) {
    const module = await import("@jsquash/jpeg");
    wasmJpegEncoder = module.encode;
  }

  const encoded = await wasmJpegEncoder(imageData, { quality });
  return new Blob([encoded], { type: "image/jpeg" });
}

/**
 * WASM을 사용한 PNG 인코딩 + OxiPNG 최적화
 */
async function encodePNGWithWasm(imageData: ImageData): Promise<Blob> {
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
}

/**
 * WebP 인코딩 (네이티브 vs WASM 비교 후 더 작은 것 선택)
 */
export async function encodeWebP(
  imageData: ImageData,
  quality: number
): Promise<Blob> {
  const isSupported = await checkWebPSupport();

  let nativeBlob: Blob | null = null;

  // 1. 네이티브 WebP 시도 (지원되면)
  if (isSupported) {
    nativeBlob = await encodeWithCanvas(imageData, "image/webp", quality);
  }

  // 2. WASM WebP 시도 (항상)
  const wasmBlob = await encodeWebPWithWasm(imageData, quality);

  // 3. 네이티브와 WASM 중 작은 것 선택
  if (nativeBlob && nativeBlob.size < wasmBlob.size) {
    return nativeBlob;
  }

  return wasmBlob;
}

/**
 * JPEG 인코딩 (항상 WASM MozJPEG 사용)
 */
export async function encodeJPEG(
  imageData: ImageData,
  quality: number
): Promise<Blob> {
  return encodeJPEGWithWasm(imageData, quality);
}

/**
 * PNG 인코딩 (항상 WASM + OxiPNG 사용)
 */
export async function encodePNG(imageData: ImageData): Promise<Blob> {
  return encodePNGWithWasm(imageData);
}

/**
 * 통합 인코더 (확장자별 자동 선택)
 */
export async function encodeImage(
  imageData: ImageData,
  targetExtension: string,
  settings?: ImageSettings
): Promise<Blob> {
  const quality = settings?.quality ?? 90;

  switch (targetExtension) {
    case "webp":
      return encodeWebP(imageData, quality);

    case "jpg":
      return encodeJPEG(imageData, quality);

    case "png":
      return encodePNG(imageData);

    default:
      throw new Error(`지원하지 않는 확장자입니다: ${targetExtension}`);
  }
}
