import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Search, Plus, MessageCircle, User } from 'lucide-react';
import { GlassSurface } from '@/components/ui';
import { cn } from '@/lib/utils';

const items = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/search', label: 'Search', icon: Search, end: false },
] as const;

const right = [
  { to: '/messages', label: 'Messages', icon: MessageCircle },
  { to: '/profile', label: 'Profile', icon: User },
] as const;

/** Floating frosted bottom navigation (glass chrome). */
export function BottomNav() {
  const navigate = useNavigate();

  const link = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex w-16 flex-col items-center gap-1 text-[10px] font-semibold transition-colors',
      isActive ? 'text-primary' : 'text-muted',
    );

  return (
    <GlassSurface
      as="nav"
      className="fixed inset-x-3 bottom-3 z-40 flex items-center justify-around rounded-3xl px-2 py-2 safe-bottom md:hidden"
    >
      {items.map(({ to, label, icon: Icon, end }) => (
        <NavLink key={to} to={to} end={end} className={link}>
          <Icon className="h-5 w-5" />
          {label}
        </NavLink>
      ))}

      <button
        onClick={() => navigate('/add')}
        aria-label="Add jewelry"
        className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-gold-light shadow-lg shadow-primary/30 active:scale-95"
      >
        <Plus className="h-6 w-6" />
      </button>

      {right.map(({ to, label, icon: Icon }) => (
        <NavLink key={to} to={to} className={link}>
          <Icon className="h-5 w-5" />
          {label}
        </NavLink>
      ))}
    </GlassSurface>
  );
}
