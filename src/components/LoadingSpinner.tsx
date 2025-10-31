const LoadingSpinner = () => {
  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
        <p className="text-sm text-gray-600">로딩 중...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
