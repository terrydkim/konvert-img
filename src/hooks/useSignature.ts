import { useCallback, useEffect, useRef, useState } from "react";

interface Point {
  x: number;
  y: number;
}

interface UseSignatureReturn {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  isDrawing: boolean;
  clear: () => void;
  toBlob: (options?: {
    quality?: number;
    type?: string;
  }) => Promise<Blob | null>;
  isEmpty: () => boolean;
  undo: () => void;
  canUndo: boolean;
}

interface SignatureOptions {
  width?: number;
  height?: number;
  strokeColor?: string;
  strokeWidth?: number;
  maxHistoryLength?: number;
}

const useSignature = (options: SignatureOptions = {}): UseSignatureReturn => {
  const {
    width = 800,
    height = 400,
    strokeColor = "#000000",
    strokeWidth = 2,
    maxHistoryLength = 20,
  } = options;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [history, setHistory] = useState<ImageData[]>([]);
  const lastPoint = useRef<Point | null>(null);

  // 히스토리 저장 (길이제한 default 20)
  const saveToHistory = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setHistory((prev) => {
        const newHistory = [...prev, imageData];
        if (newHistory.length > maxHistoryLength) {
          return newHistory.slice(-maxHistoryLength);
        }
        return newHistory;
      });
    },
    [maxHistoryLength]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    // CSS 크기
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    // 실제 캔버스 크기
    canvas.width = width * dpr;
    canvas.height = height * dpr;

    // 컨텍스트 스케일링
    ctx.scale(dpr, dpr);

    setContext(ctx);
  }, [width, height]);

  // 스타일 설정 및 초기 히스토리 저장
  useEffect(() => {
    if (!context) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    context.strokeStyle = strokeColor;
    context.lineWidth = strokeWidth;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.fillStyle = strokeColor;

    saveToHistory(context);
  }, [context, strokeColor, strokeWidth, saveToHistory]);

  // 좌표 계산 (DPR 고려)
  const getCoordinates = (e: MouseEvent | TouchEvent): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0]?.clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0]?.clientY : e.clientY;

    if (clientX === undefined || clientY === undefined) return null;

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  // 그리기 시작
  const startDrawing = useCallback(
    (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      const point = getCoordinates(e);
      if (!point || !context) return;

      setIsDrawing(true);
      lastPoint.current = point;

      // 점 찍기
      context.beginPath();
      context.arc(point.x, point.y, strokeWidth / 2, 0, Math.PI * 2);
      context.fill();
    },
    [context, strokeWidth]
  );

  // 그리기
  const draw = useCallback(
    (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      if (!isDrawing || !context || !lastPoint.current) return;

      const point = getCoordinates(e);
      if (!point) return;

      context.beginPath();
      context.moveTo(lastPoint.current.x, lastPoint.current.y);
      context.lineTo(point.x, point.y);
      context.stroke();

      lastPoint.current = point;
    },
    [isDrawing, context]
  );

  const endDrawing = useCallback(() => {
    if (isDrawing && context) {
      saveToHistory(context);
    }
    setIsDrawing(false);
    lastPoint.current = null;
  }, [isDrawing, context, saveToHistory]);

  // 이벤트리스너 등록
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 캔버스 밖에서 끝나는 경우 처리
    const handleGlobalEnd = () => {
      if (isDrawing) endDrawing();
    };

    // 마우스 이벤트
    canvas.addEventListener("mousedown", startDrawing);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", endDrawing);
    canvas.addEventListener("mouseleave", endDrawing);

    // 터치 이벤트
    canvas.addEventListener("touchstart", startDrawing, { passive: false });
    canvas.addEventListener("touchmove", draw, { passive: false });
    canvas.addEventListener("touchend", endDrawing);
    canvas.addEventListener("touchcancel", endDrawing);

    // 글로벌 이벤트
    window.addEventListener("mouseup", handleGlobalEnd);
    window.addEventListener("touchend", handleGlobalEnd);

    return () => {
      canvas.removeEventListener("mousedown", startDrawing);
      canvas.removeEventListener("mousemove", draw);
      canvas.removeEventListener("mouseup", endDrawing);
      canvas.removeEventListener("mouseleave", endDrawing);

      canvas.removeEventListener("touchstart", startDrawing);
      canvas.removeEventListener("touchmove", draw);
      canvas.removeEventListener("touchend", endDrawing);
      canvas.removeEventListener("touchcancel", endDrawing);

      window.removeEventListener("mouseup", handleGlobalEnd);
      window.removeEventListener("touchend", handleGlobalEnd);
    };
  }, [startDrawing, draw, endDrawing, isDrawing]);

  // 초기화
  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);

    // 스타일 복원
    context.strokeStyle = strokeColor;
    context.fillStyle = strokeColor;
    context.lineWidth = strokeWidth;

    setHistory([]);
    saveToHistory(context);
  }, [context, strokeColor, strokeWidth, saveToHistory]);

  // Undo
  const undo = useCallback(() => {
    if (history.length <= 1 || !context) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const newHistory = history.slice(0, -1);
    const previousState = newHistory[newHistory.length - 1];

    if (previousState) {
      context.putImageData(previousState, 0, 0);
      setHistory(newHistory);
    }
  }, [history, context]);

  const toBlob = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        resolve(null);
        return;
      }

      canvas.toBlob((blob) => {
        resolve(blob);
      }, "image/png");
    });
  }, []);
  // 비어있는지 확인
  const isEmpty = useCallback((): boolean => {
    const canvas = canvasRef.current;
    if (!canvas || !context) return true;

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    // 알파 채널 체크
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] !== 0) {
        return false;
      }
    }

    return true;
  }, [context]);

  return {
    canvasRef,
    isDrawing,
    clear,
    toBlob,
    isEmpty,
    undo,
    canUndo: history.length > 1,
  };
};

export default useSignature;
