import JSZip from "jszip";
import type { FileItem } from "../types/types";

const useDownload = () => {
  const downloadSingle = (fileItem: FileItem) => {
    if (!fileItem.convertedUrl) return;

    const link = document.createElement("a");
    link.href = fileItem.convertedUrl;

    const originalNameWithoutExt = fileItem.file.name.replace(/\.[^/.]+$/, "");
    link.download = `${originalNameWithoutExt}.${fileItem.targetExtension}`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadZip = async (files: FileItem[]): Promise<boolean> => {
    const successFiles = files.filter(
      (file) => file.status === "success" && file.convertedBlob
    );

    if (successFiles.length === 0) {
      alert("다운로드할 파일이 없습니다.");
      return false;
    }

    try {
      const zip = new JSZip();

      successFiles.forEach((fileItem) => {
        const originalNameWithoutExt = fileItem.file.name.replace(
          /\.[^/.]+$/,
          ""
        );
        const fileName = `${originalNameWithoutExt}.${fileItem.targetExtension}`;

        zip.file(fileName, fileItem.convertedBlob!);
      });

      const zipBlob = await zip.generateAsync({ type: "blob" });

      const link = document.createElement("a");
      link.href = URL.createObjectURL(zipBlob);
      link.download = "converted_images.zip";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(link.href);

      return true;
    } catch (error) {
      console.error("ZIP 생성 중 오류 발생:", error);
      alert("ZIP 파일 생성 중 오류가 발생했습니다.");
      return false;
    }
  };

  return { downloadSingle, downloadZip };
};

export default useDownload;
