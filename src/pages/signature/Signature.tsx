import SEO from "../../components/SEO";
import Toast from "../../components/Toast";
import useSignature from "../../hooks/useSignature";
import useToast from "../../hooks/useToast";

const Signature = () => {
  const { canvasRef, clear, toBlob, isEmpty, undo, canUndo } = useSignature({
    width: 400,
    height: 200,
    strokeColor: "#000000",
    strokeWidth: 5,
  });

  const { toasts, showToast, removeToast } = useToast();

  const handleClear = () => {
    clear();
  };

  const handleDownload = async () => {
    if (isEmpty()) {
      showToast("서명을 먼저 작성해주세요.", "warning");
      return;
    }

    const blob = await toBlob();
    if (!blob) {
      showToast("서명을 다운로드할 수 없습니다.", "error");
      return;
    }

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `signature-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);

    showToast("서명이 다운로드되었습니다!", "success");
  };

  const signatureJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "konvert-img 온라인 서명",
    "url": "https://konvert-img.com/signature",
    "description": "무료 온라인 전자 서명 도구. 마우스나 터치로 서명하고 PNG로 다운로드하세요.",
    "applicationCategory": "MultimediaApplication",
    "operatingSystem": "Any",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "KRW"
    },
    "featureList": [
      "마우스/터치 서명",
      "PNG 다운로드",
      "실행 취소 기능",
      "브라우저 내 처리"
    ]
  };

  return (
    <>
      <SEO
        title="무료 온라인 서명 | 전자서명 PNG 다운로드 - konvert-img"
        description="무료 온라인 전자 서명 도구. 마우스나 터치로 간편하게 서명하고 PNG 이미지로 저장하세요. 계약서, 문서 서명에 활용 가능."
        keywords="온라인 서명, 전자서명, 서명 이미지, 서명 PNG, 무료 서명, 디지털 서명"
        canonical="https://konvert-img.com/signature"
        jsonLd={signatureJsonLd}
      />
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8 lg:p-10 ">
          <div className="max-w-2xl md:max-w-xl lg:max-w-2xl mx-auto">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 md:mb-6 text-center text-gray-800">
            온라인 서명
          </h1>

        <section className="mb-4 md:mb-6 text-center bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <p className="text-gray-600 text-sm md:text-base mb-4 md:mb-6">
            아래 영역에 마우스나 터치로 서명해주세요
          </p>

          {/* Canvas 영역 */}
          <div className="border-2 border-gray-300 rounded-lg overflow-hidden mb-4 w-full max-w-[400px] mx-auto">
            <canvas
              ref={canvasRef}
              className="touch-none cursor-crosshair block w-full"
            />
          </div>

          {/* 버튼 영역 */}
          <div className="flex flex-wrap gap-2 md:gap-3 justify-center">
            <button
              onClick={undo}
              disabled={!canUndo}
              className="px-4 py-2 md:px-6 md:py-2.5 text-sm md:text-base bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
            >
              실행취소
            </button>

            <button
              onClick={handleClear}
              className="px-4 py-2 md:px-6 md:py-2.5 text-sm md:text-base bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-medium"
            >
              지우기
            </button>

            <button
              onClick={handleDownload}
              className="px-4 py-2 md:px-6 md:py-2.5 text-sm md:text-base bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium"
            >
              다운로드
            </button>
          </div>
        </section>
      </div>

      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </div>
    </>
  );
};

export default Signature;
