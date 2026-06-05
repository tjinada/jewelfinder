import { type ReactNode, type FormEvent, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Search, Plus, LogOut, Settings } from 'lucide-react';
import { GlassSurface } from '@/components/ui';
import { BottomNav } from './BottomNav';
import { useAuthStore } from '@/stores/authStore';
import { useLogout } from '@/features/auth/useAuth';
import { useUnreadCount } from '@/features/messaging/api';
import { useIncomingPendingCount } from '@/features/bookings/api';
import { cn } from '@/lib/utils';

const navLinks = [
  { to: '/', label: 'Home', end: true },
  { to: '/closets', label: 'Closets', end: false },
  { to: '/messages', label: 'Messages', end: false },
  { to: '/requests', label: 'Requests', end: false },
] as const;

/**
 * App shell used by every signed-in page. Responsive like v3:
 * - Desktop: top glass nav with links + search + Add; content in a wide max-w-7xl grid.
 * - Mobile: minimal top bar + a glass bottom tab bar (md:hidden).
 */
export function MainLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const unread = useUnreadCount();
  const pending = useIncomingPendingCount();
  const [q, setQ] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const initial = user?.displayName?.charAt(0)?.toUpperCase() || 'U';

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    if (q.trim()) navigate(`/?q=${encodeURIComponent(q.trim())}`);
  };

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate('/login');
  };

  const deskLink = ({ isActive }: { isActive: boolean }) =>
    cn(
      'rounded-xl px-3.5 py-2 text-sm font-medium transition-colors',
      isActive ? 'bg-primary/10 text-primary' : 'text-ink/70 hover:bg-ink/5 hover:text-ink',
    );

  return (
    <div className="relative min-h-[100dvh]">
      {/* Ambient blooms — depth on wide screens, and something for the glass to refract */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 right-1/4 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute left-[-8rem] top-1/3 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-gold/10 blur-3xl" />
      </div>

      <GlassSurface
        as="header"
        className="sticky top-0 z-40 rounded-none border-x-0 border-t-0 safe-top"
      >
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 md:h-16">
          <NavLink to="/" className="flex items-center gap-2">
            <img src="/icons/icon-512.png" alt="" className="h-8 w-8 rounded-lg" />
            <span className="font-playfair text-2xl font-bold text-primary md:text-3xl">The Clasp</span>
          </NavLink>

          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((l) => {
              const badge = l.to === '/messages' ? unread : l.to === '/requests' ? pending : 0;
              return (
                <NavLink key={l.to} to={l.to} end={l.end} className={deskLink}>
                  <span className="relative">
                    {l.label}
                    {badge > 0 && (
                      <span className="absolute -right-3 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-white">
                        {badge > 9 ? '9+' : badge}
                      </span>
                    )}
                  </span>
                </NavLink>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 md:gap-3">
            <form onSubmit={onSearch} className="hidden md:block">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search jewelry…"
                  className="w-64 rounded-xl border border-line bg-surface/80 py-2.5 pl-10 pr-4 text-sm text-ink outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </form>

            <button
              onClick={() => navigate('/add')}
              className="hidden items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-gold-light md:inline-flex"
            >
              <Plus className="h-4 w-4" /> Add
            </button>

            {/* Profile + menu */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="Account menu"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-bold text-gold-light"
              >
                {initial}
              </button>

              {menuOpen && (
                <>
                  <button
                    aria-hidden
                    onClick={() => setMenuOpen(false)}
                    className="fixed inset-0 z-40 cursor-default"
                    tabIndex={-1}
                  />
                  <div className="absolute right-0 z-50 mt-2 w-56 rounded-2xl border border-line bg-surface p-2 text-ink shadow-xl">
                    <div className="px-3 py-2">
                      <p className="truncate text-sm font-semibold">{user?.displayName}</p>
                      <p className="truncate text-xs text-muted">{user?.email}</p>
                    </div>
                    <div className="my-1 border-t border-line/70" />
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        navigate('/settings');
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-ink hover:bg-ink/5"
                    >
                      <Settings className="h-4 w-4" /> Settings
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-accent hover:bg-accent/10"
                    >
                      <LogOut className="h-4 w-4" /> Log out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </GlassSurface>

      <main className="relative z-10 mx-auto max-w-7xl px-4 pb-28 pt-5 sm:px-6 md:pb-12">
        {children}
      </main>

      <BottomNav />
    </div>
  );
}
