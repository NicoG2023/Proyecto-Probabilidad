import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStrict } from '../auth/AuthContext';

export default function NavBar({ title = 'Cinema Management' }: { title?: string }) {
  const { username, authenticated, login, logout, hasRealmRole } = useAuthStrict();
  const navigate = useNavigate();
  const location = useLocation();

  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const isAdmin = useMemo(
    () => authenticated && hasRealmRole('admin'),
    [authenticated, hasRealmRole]
  );

  const initial = useMemo(() => {
    if (!username) return '?';
    const base = username.split('@')[0]?.trim() || username.trim();
    return base.charAt(0).toUpperCase();
  }, [username]);

  useEffect(() => { setOpen(false); }, [location]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!open) return;
      const t = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(t) && buttonRef.current && !buttonRef.current.contains(t)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false); }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <header className="w-full bg-[#1E1E1E]">
      <div className="mx-auto max-w-7xl px-6 pt-6">
        {/* Barra roja completa */}
        <nav
          aria-label="Top Navigation"
          className="flex items-center justify-between rounded-2xl bg-[#D90429] px-5 py-3"
        >
          {/* Título blanco sobre la barra roja */}
          <Link to="/" className="text-xl font-bold tracking-wide text-white">
            {title}
          </Link>

          {/* Lado derecho */}
          <div className="flex items-center gap-3">
            {!authenticated ? (
              <button
                onClick={login}
                className="rounded-xl bg-[#FFDA63] px-4 py-2 text-sm font-semibold text-[#333333] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#FFDA63]/60"
              >
                Login
              </button>
            ) : (
              <div className="relative">
                <button
                  ref={buttonRef}
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={open}
                  onClick={() => setOpen(v => !v)}
                  className="flex items-center gap-3 rounded-full bg-[#333333] pl-2 pr-3 py-1 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                >
                  <span
                    aria-hidden
                    className="grid h-8 w-8 place-items-center rounded-full bg-[#FFDA63] text-[#333333] text-sm font-bold"
                  >
                    {initial}
                  </span>
                  <span className="text-sm font-medium">{username}</span>
                  <svg
                    className={`h-4 w-4 transition ${open ? 'rotate-180' : ''}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>

                {open && (
                  <div
                    ref={menuRef}
                    role="menu"
                    aria-label="User menu"
                    className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-[#333333] bg-[#1E1E1E] shadow-lg"
                  >
                    <button
                      role="menuitem"
                      onClick={logout}
                      className="block w-full px-4 py-3 text-left text-sm text-white hover:bg-[#333333] focus:outline-none"
                    >
                      logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
