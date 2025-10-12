import { useEffect, useId, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { navLink } from "./header.nav-link.cva";

type LinkItem = { to: string; label: string };

type HamburgerMenuProps = {
  links: LinkItem[];
  breakpoint?: "sm" | "md" | "lg" | "xl";
  className?: string;
  panelClassName?: string;
};

const bpToClass = (bp: HamburgerMenuProps["breakpoint"]) => bp ?? "md";

const HamburgerMenu = ({
  links,
  breakpoint = "md",
  className = "",
  panelClassName = "",
}: HamburgerMenuProps) => {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const location = useLocation();

  // 라우트 변경 시 닫기
  useEffect(() => setOpen(false), [location.pathname]);

  // ESC 닫기 + 포커스 복원
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) =>
      e.key === "Escape" && (setOpen(false), btnRef.current?.focus());
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onDown = (e: MouseEvent) => {
      if (!panelRef.current || panelRef.current.contains(e.target as Node))
        return;
      if (btnRef.current && btnRef.current.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDown); // window, document는 코딩 관례
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const bp = bpToClass(breakpoint);

  return (
    <div className={`justify-self-end ${bp}:hidden ${className}`}>
      <button
        ref={btnRef}
        type="button"
        className={`inline-flex ${bp}:hidden items-center justify-center rounded-md p-2 text-white/90 hover:text-white hover:bg-white/10 
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60`}
        aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
        aria-expanded={open ? true : false}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? (
          /* X */
          <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M6 6l12 12M18 6l-12 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          /* ☰ */
          <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M3 6h18M3 12h18M3 18h18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        )}
      </button>
      <div
        ref={panelRef}
        id={panelId}
        className={[
          `${bp}:hidden overflow-hidden transition-[max-height,opacity] duration-300`,
          open ? "max-h-96 opacity-100" : "max-h-0 opacity-0",
          panelClassName,
        ].join(" ")}
      >
        <nav aria-label="모바일 탐색" className="pt-2">
          <ul className="flex flex-col gap-2 py-2">
            {links.map(({ to, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    [
                      navLink({ active: isActive }),
                      "w-full px-2 py-2 hover:bg-white/10",
                    ].join(" ")
                  }
                >
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default HamburgerMenu;
