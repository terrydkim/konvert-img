export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-slate-800 to-slate-900 text-white mt-20">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About Section */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-cyan-400">Konvert-img</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              무료 온라인 이미지 변환 도구입니다.
              브라우저에서 안전하게 이미지를 변환하세요.
            </p>
          </div>

          {/* Features Section */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-cyan-400">특징</h3>
            <ul className="text-slate-300 text-sm space-y-2">
              <li className="flex items-center gap-2">
                <span className="text-cyan-400">✓</span> 100% 클라이언트 사이드 처리
              </li>
              <li className="flex items-center gap-2">
                <span className="text-cyan-400">✓</span> 개인정보 보호
              </li>
              <li className="flex items-center gap-2">
                <span className="text-cyan-400">✓</span> 무료 사용
              </li>
            </ul>
          </div>

          {/* Contact Section */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-cyan-400">만든이</h3>
            <p className="text-slate-300 text-sm">
              Terry
            </p>
            <p className="text-slate-400 text-xs mt-4">
              © 2025 Konvert-img. All rights reserved.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-700 mt-8 pt-6 text-center">
          <p className="text-slate-400 text-sm">
            Made with using React, TypeScript, and Tailwind CSS
          </p>
        </div>
      </div>
    </footer>
  );
}
