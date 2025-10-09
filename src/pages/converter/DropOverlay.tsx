import ImageUploadIcon from '../../components/icons/ImageUploadIcon';

type DropOverlayProps = {
  fileCount: number;
};

const DropOverlay = ({ fileCount }: DropOverlayProps) => {
  return (
    <div className="fixed inset-0 bg-blue-100 bg-opacity-100 border-4 border-dashed border-blue-500 z-50 flex items-center justify-center pointer-events-none">
      <div className="bg-white rounded-lg shadow-lg p-12 text-center">
        <ImageUploadIcon className="w-24 h-24 mx-auto mb-6 text-blue-500" />
        <p className="text-3xl font-bold text-blue-600 mb-2">
          {fileCount}개 파일을 드롭합니다
        </p>
        <p className="text-gray-500 text-sm">
          이미지 파일을 여기에 놓으세요
        </p>
      </div>
    </div>
  );
};

export default DropOverlay;
