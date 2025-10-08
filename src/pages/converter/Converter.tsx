import { useRef, useState } from "react";
import useFileDrop from "../../hooks/useFileDrop";
import DropOverlay from './DropOverlay';

const Converter = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesAdded = (files: File[]) => {
    setSelectedFiles((prev) => [...prev, ...files]);
    console.log("드롭된 파일", files);
  };

  const { isDragging, fileCount } = useFileDrop(handleFilesAdded);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const fileArray = Array.from(files);
    setSelectedFiles(fileArray);

    console.log("선택된 파일", fileArray);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      Converter Page
      <div>
        <button onClick={handleUploadClick}>Select Files</button>
        <input
          type="file"
          ref={fileInputRef}
          multiple
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>
      {selectedFiles.length > 0 && (
        <div>
          <h3>Selected Files:</h3>
          <ul>
            {selectedFiles.map((file, index) => (
              <li key={index}>{file.name}</li>
            ))}
          </ul>
        </div>
      )}
      {isDragging && <DropOverlay fileCount={fileCount} />}
    </div>
  );
};

export default Converter;
