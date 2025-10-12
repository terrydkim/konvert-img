import { Link, NavLink } from "react-router-dom";
import ConverterIcon from "../icons/ConverterIcon";
import { navLink } from "./header.nav-link.cva";

export default function Header() {
  return (
    <header className="bg-gradient-to-r from-cyan-500 to-blue-600 shadow-lg">
      <div className="container mx-auto px-4 py-3 md:px-6 md:py-4">
        <div className="grid grid-cols-3 items-center gap-2 md:gap-6">
          <Link
            to="/"
            aria-label="홈으로 이동"
            className="flex items-center gap-3 
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 rounded-lg"
          >
            <ConverterIcon size={40} className="drop-shadow-md" />
            <span className="font-bold text-white tracking-tight text-xl sm:text-2xl md:text-3xl lg:text-4xl">
              Konvert-img
            </span>
          </Link>
          <nav
            className="justify-self-center hidden md:block"
            aria-label="메인 탐색"
          >
            <ul className="flex gap-6">
              <li>
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    navLink({ active: isActive, size: "md" })
                  }
                >
                  이미지 변환
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/remove-background"
                  className={({ isActive }) =>
                    navLink({ active: isActive, size: "md" })
                  }
                >
                  배경 제거
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/signature"
                  className={({ isActive }) =>
                    navLink({ active: isActive, size: "md" })
                  }
                >
                  서명
                </NavLink>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
}
