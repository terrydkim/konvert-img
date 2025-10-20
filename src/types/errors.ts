/**
 * 이미지 인코딩 관련 에러 타입
 */
export class ImageEncodingError extends Error {
  readonly code:
    | "WASM_LOAD_FAILED"
    | "CANVAS_NOT_SUPPORTED"
    | "ENCODING_FAILED"
    | "UNSUPPORTED_FORMAT"
    | "OUT_OF_MEMORY";
  readonly cause?: unknown;

  constructor(
    message: string,
    code:
      | "WASM_LOAD_FAILED"
      | "CANVAS_NOT_SUPPORTED"
      | "ENCODING_FAILED"
      | "UNSUPPORTED_FORMAT"
      | "OUT_OF_MEMORY",
    cause?: unknown
  ) {
    super(message);
    this.name = "ImageEncodingError";
    this.code = code;
    this.cause = cause;
  }
}
