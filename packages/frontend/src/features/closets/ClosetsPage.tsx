import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Loader2, User, X } from 'lucide-react';
import { Hanger } from '@/components/icons/Hanger';
import { MainLayout } from '@/components/layout';
import { Button } from '@/components/ui';
import { getErrorMessage } from '@/features/auth';
import { useJewelryList } from '@/features/jewelry/api';
import { useMyClosets, useCreateCloset } from './api';
import { closetColor, MY_CLOSET_COLOR } from './tileColors';

const tileBase =
  'flex min-h-[96px] flex-col justify-between rounded-2xl p-4 transition-transform active:scale-[0.98]';

export function ClosetsPage() {
  const navigate = useNavigate();
  const { data: closets, isLoading } = useMyClosets();
  const { data: ownItems } = useJewelryList({ scope: 'mine' });
  const create = useCreateCloset();

  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const myCount = ownItems?.length;

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) return setError('Please name the closet.');
    try {
      const closet = await create.mutateAsync(name.trim());
      setName('');
      setCreating(false);
      navigate(`/closets/${closet._id}`);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <MainLayout>
      <div className="mx-auto max-w-2xl">
        <div className="mb-5">
          <h1 className="font-display text-2xl text-ink md:text-3xl">Your closets</h1>
          <p className="mt-1 text-sm text-muted">
            Your own pieces, plus any closets you share with a group.
          </p>
        </div>

        {/* Inline create form (revealed by the "New closet" tile) */}
        {creating && (
          <form onSubmit={onCreate} className="mb-4 flex gap-2">
            <input
              type="text"
              autoFocus
              maxLength={60}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="New closet name (e.g. Family)"
              className="flex-1 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Create
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setCreating(false);
                setName('');
                setError('');
              }}
              className="px-3"
            >
              <X className="h-4 w-4" />
            </Button>
          </form>
        )}

        {error && (
          <p className="mb-4 rounded-lg bg-[#F4E7D5] px-3 py-2 text-sm text-onloan">{error}</p>
        )}

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {/* My closet — items the user owns */}
            <Link
              to="/?scope=mine"
              className={tileBase}
              style={{
                backgroundColor: MY_CLOSET_COLOR.bg,
                border: `2px solid ${MY_CLOSET_COLOR.sub}`,
              }}
            >
              <div className="flex items-center justify-between">
                <User className="h-5 w-5" style={{ color: MY_CLOSET_COLOR.text }} />
                <span
                  className="rounded-md px-2 py-0.5 text-[10px] font-bold"
                  style={{ backgroundColor: MY_CLOSET_COLOR.text, color: MY_CLOSET_COLOR.bg }}
                >
                  Yours
                </span>
              </div>
              <div>
                <p className="font-semibold" style={{ color: MY_CLOSET_COLOR.text }}>
                  My closet
                </p>
                <p className="text-xs" style={{ color: MY_CLOSET_COLOR.sub }}>
                  {myCount === undefined ? '…' : `${myCount} ${myCount === 1 ? 'item' : 'items'}`}
                </p>
              </div>
            </Link>

            {/* Shared closets */}
            {closets?.map((c, i) => {
              const color = closetColor(i);
              return (
                <Link
                  key={c._id}
                  to={`/closets/${c._id}`}
                  className={tileBase}
                  style={{ backgroundColor: color.bg }}
                >
                  <Hanger className="h-5 w-5" style={{ color: color.text }} />
                  <div>
                    <p className="truncate font-semibold" style={{ color: color.text }}>
                      {c.name}
                    </p>
                    <p className="text-xs" style={{ color: color.sub }}>
                      {c.itemCount} {c.itemCount === 1 ? 'item' : 'items'}
                    </p>
                  </div>
                </Link>
              );
            })}

            {/* New closet */}
            <button
              type="button"
              onClick={() => setCreating(true)}
              className={`${tileBase} items-center justify-center gap-1.5 border-2 border-dashed border-line text-muted hover:border-primary/50 hover:text-primary`}
            >
              <Plus className="h-5 w-5" />
              <span className="text-sm font-semibold">New closet</span>
            </button>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
