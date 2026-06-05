import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Plus, MessageCircle, CalendarClock } from 'lucide-react';
import { Hanger } from '@/components/icons/Hanger';
import { GlassSurface } from '@/components/ui';
import { useUnreadCount } from '@/features/messaging/api';
import { useIncomingPendingCount } from '@/features/bookings/api';
import { cn } from '@/lib/utils';

const items = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/closets', label: 'Closets', icon: Hanger, end: false },
] as const;

const right = [
  { to: '/messages', label: 'Messages', icon: MessageCircle },
  { to: '/requests', label: 'Requests', icon: CalendarClock },
] as const;

/** Floating frosted bottom navigation (glass chrome). */
export function BottomNav() {
  const navigate = useNavigate();
  const unread = useUnreadCount();
  const pending = useIncomingPendingCount();

  const badgeFor = (to: string) =>
    to === '/messages' ? unread : to === '/requests' ? pending : 0;

  const link = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex w-16 flex-col items-center gap-1 text-[10px] font-medium transition-colors',
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

      {right.map(({ to, label, icon: Icon }) => {
        const badge = badgeFor(to);
        return (
          <NavLink key={to} to={to} className={link}>
            <span className="relative">
              <Icon className="h-5 w-5" />
              {badge > 0 && (
                <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-white">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </span>
            {label}
          </NavLink>
        );
      })}
    </GlassSurface>
  );
}
