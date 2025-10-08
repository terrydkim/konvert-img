import { isMobile } from "../utils";
import {
  ALLOWED_TYPES,
  MAX_FILE_SIZE,
  MAX_SIZE_TOOLTIP_DESKTOP,
  MAX_SIZE_TOOLTIP_MOBILE,
  MAX_TOTAL_SIZE_DESKTOP,
  MAX_TOTAL_SIZE_MOBILE,
} from "../utils/const";

interface ValidationResult {
  valid: File[];
  invalid: Array<{ file: File; reason: string }>;
}

const getTotalSize = (files: File[]) => {
  return files.reduce((sum, file) => sum + file.size, 0);
};

const validateFiles = (newFiles: File[], currentFiles: File[]) => {
  const maxTotalSize = isMobile()
    ? MAX_TOTAL_SIZE_MOBILE
    : MAX_TOTAL_SIZE_DESKTOP;
  const result: ValidationResult = { valid: [], invalid: [] };
  const currentTotalSize = getTotalSize(currentFiles);

  for (const file of newFiles) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      result.invalid.push({ file, reason: "지원하지 않는 파일 형식" });
      continue;
    }

    if (file.size > MAX_FILE_SIZE) {
      result.invalid.push({ file, reason: "파일 크기 초과(최대 100MB)" });
      continue;
    }

    const newTotalSize =
      currentTotalSize + getTotalSize(result.valid) + file.size;
    if (newTotalSize > maxTotalSize) {
      const limitText = isMobile()
        ? MAX_SIZE_TOOLTIP_MOBILE
        : MAX_SIZE_TOOLTIP_DESKTOP;

      result.invalid.push({
        file,
        reason: `총 파일 크기 초과(최대 ${limitText})`,
      });
      continue;
    }

    result.valid.push(file);
  }

  return result;
};

export default validateFiles;
