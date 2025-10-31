/**
 * 이미지 파일로부터 리사이징된 썸네일을 생성합니다.
 *
 * @param file - 원본 이미지 파일
 * @param maxSize - 썸네일의 최대 크기 (px, 기본값: 200)
 * @param quality - 이미지 품질 (0-1, 기본값: 0.8)
 * @returns 썸네일 이미지의 Object URL
 */
export async function createThumbnail(
  file: File,
  maxSize: number = 200,
  quality: number = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      try {
        // 원본 URL 정리
        URL.revokeObjectURL(objectUrl);

        // 리사이징 비율 계산
        const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
        const width = Math.floor(img.width * scale);
        const height = Math.floor(img.height * scale);

        // Canvas에 리사이징된 이미지 그리기
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context를 가져올 수 없습니다.'));
          return;
        }

        // 이미지 품질 향상을 위한 설정
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(img, 0, 0, width, height);

        // Canvas를 Blob으로 변환
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('썸네일 생성에 실패했습니다.'));
              return;
            }

            // Blob으로부터 Object URL 생성
            const thumbnailUrl = URL.createObjectURL(blob);
            resolve(thumbnailUrl);
          },
          'image/jpeg', // 썸네일은 JPEG로 저장 (용량 절감)
          quality
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('이미지 로드에 실패했습니다.'));
    };

    img.src = objectUrl;
  });
}
