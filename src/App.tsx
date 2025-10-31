import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { lazy, Suspense } from 'react';
import Footer from './components/Footer';
import Header from "./components/header/Header";
import LoadingSpinner from './components/LoadingSpinner';

// 라우트별 코드 스플리팅 - 각 페이지를 필요할 때만 로드
const Converter = lazy(() => import("./pages/converter/Converter"));
const RemoveBackground = lazy(() => import('./pages/remove-background/RemoveBackground'));
const Signature = lazy(() => import("./pages/signature/Signature"));

function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path="/" element={<Converter />} />
                <Route path="/remove-background" element={<RemoveBackground />} />
                <Route path="/signature" element={<Signature />} />
              </Routes>
            </Suspense>
          </main>
          <Footer/>
        </div>
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;
