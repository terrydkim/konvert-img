# konvert-img

브라우저에서 바로 실행되는 무료 이미지 변환 도구입니다.

## 목차

- [주요 기능](#-주요-기능)
- [기술 스택](#-기술-스택)
- [프로젝트 구조](#-프로젝트-구조)
- [아키텍처](#-아키텍처)
- [트러블슈팅](#-트러블슈팅)
- [라이센스](#-라이센스)

## ✨ 주요 기능

- **이미지 포맷 변환** - JPEG, PNG, WebP 간 자유롭게 변환
- **배치 변환** - 여러 이미지를 한번에 처리하고 ZIP으로 다운로드
- **이미지 설정** - 크기와 품질 조정
- **배경 제거** - AI 기반 배경 자동 제거
- **브라우저 내 처리** - 서버 업로드 없이 로컬에서 처리 (개인정보 안전)

## 🛠️ 기술 스택

- React 19 + TypeScript
- Vite (빌드 및 개발 서버)
- Tailwind CSS
- Web Workers (이미지 처리 성능 최적화)
- JSQuash (이미지 인코딩)
- JSZip (일괄 다운로드)

## 📁 프로젝트 구조

```
src/
├── pages/
│   ├── converter/          # 이미지 변환 페이지
│   ├── remove-background/  # 배경 제거 페이지
│   └── signature/          # 서명 기능 (개발 중)
├── components/
│   ├── header/             # 헤더 및 네비게이션
│   ├── icons/              # 아이콘 컴포넌트
│   ├── Footer.tsx
│   └── Toast.tsx           # 알림 메시지
├── hooks/
│   ├── useImageConverter.ts    # 이미지 변환 로직
│   ├── useWorkerPool.ts        # 워커 풀 관리
│   ├── useFileManager.ts       # 파일 상태 관리
│   ├── useConversionHandler.ts # 변환 진행 처리
│   ├── useDownload.ts          # 다운로드 처리
│   └── ...
├── workers/
│   ├── imageConversion.worker.ts    # 이미지 변환 워커
│   ├── backgroundRemoval.worker.ts  # 배경 제거 워커
│   └── imageEncoders.worker.ts      # 인코더 초기화
├── types/
│   ├── types.ts            # 타입 정의
│   └── errors.ts           # 에러 타입
└── utils/
    ├── const.ts            # 상수
    └── index.ts            # 유틸리티 함수
```

## 🏗️ 아키텍처

### Web Worker 활용

이미지 변환은 메인 스레드를 블로킹하지 않도록 Web Worker에서 처리됩니다.

- **Worker Pool**: 동시에 여러 이미지를 변환하기 위해 워커 풀 패턴 사용, 모바일과 노트북을 고려하여 워커는 **최대 2개**다. <br/> 둘 다 최소 4개를 가지고 있지만 인코딩 라이브러리가 생각보다 무겁기 때문에 2개로 제한.
- **Progress Tracking**: 변환 진행 상황을 실시간으로 UI에 반영
- **Error Handling**: 워커 내 에러를 메인 스레드로 전달하여 Toast로 표시

## 🔧 트러블슈팅

### 1. Safari 크로스 브라우징
##### 문제
- safari의 경우 캔버스를 그리는 디코딩은 되는데 다운로드를 위해 WebP로 변환하는 인코딩이 되지 않아 PNG로 폴백된다.

##### 해결
- WebP를 지원하지 않는 브라우저의 경우에는 WASM으로 작성된 라이브러리를 사용하도록 분기처리.
- 캔버스에 테스트를 해보고 WebP로 변환했을 때 MIME 타입이 Webp가 아니면 라이브러리를 사용한다.
- Webp를 지원하는 브라우저는 캔버스에 그리고 실패할 경우 폴백으로 라이브러리를 사용.

### 2. JPG -> PNG로 변환
##### 문제
- JPG에서 PNG로 변환하거나 PNG -> PNG로 변환할 때 용량이 많이 증가한다.
##### 원인
- JPG가 디코딩 될 때 압축이 풀리고 브라우저 내장 인코더로 기존 압축률보다 낮게 처리할 경우 용량이 증가한다. (Canvas API의 toBlob() 사용 시 압축 효율이 낮아 발생)
- PNG의 경우 캔버스에 그릴 때 픽셀 수가 증가하여 이런 현상이 발생한 것 같다.

##### 해결
- MozJPEG, OxiPNG 라이브러리를 사용하여 증가하는 크기를 최대한 줄이자. (다른 라이브러리에 비해 압축률도 좋고 빠르다.)

##### 비고
번들 크기는 증가하지만 사용자 경험은 보다 좋아졌다.

