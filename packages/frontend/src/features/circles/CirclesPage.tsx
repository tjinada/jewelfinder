import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Plus, Loader2, ChevronRight } from 'lucide-react';
import { MainLayout } from '@/components/layout';
import { Button } from '@/components/ui';
import { getErrorMessage } from '@/features/auth';
import { useMyCircles, useCreateCircle } from './api';

export function CirclesPage() {
  const navigate = useNavigate();
  const { data: circles, isLoading } = useMyCircles();
  const create = useCreateCircle();

  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) return setError('Please name the circle.');
    try {
      const circle = await create.mutateAsync(name.trim());
      setName('');
      navigate(`/circles/${circle._id}`);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <MainLayout>
      <div className="mx-auto max-w-2xl">
        <div className="mb-5">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-primary">
            <Users className="h-4 w-4" /> Circles
          </p>
          <h1 className="font-display text-2xl text-ink md:text-3xl">Your circles</h1>
          <p className="mt-1 text-sm text-muted">
            Share items with a chosen group instead of everyone.
          </p>
        </div>

        {/* Create */}
        <form onSubmit={onCreate} className="mb-6 flex gap-2">
          <input
            type="text"
            maxLength={60}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New circle name (e.g. Family)"
            className="flex-1 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Create
          </Button>
        </form>

        {error && (
          <p className="mb-4 rounded-lg bg-[#F4E7D5] px-3 py-2 text-sm text-onloan">{error}</p>
        )}

        {/* List */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        ) : circles && circles.length > 0 ? (
          <ul className="space-y-2.5">
            {circles.map((c) => (
              <li key={c._id}>
                <Link
                  to={`/circles/${c._id}`}
                  className="flex items-center justify-between rounded-2xl border border-line bg-surface px-4 py-3.5 transition-colors hover:border-primary/40"
                >
                  <div>
                    <p className="font-semibold text-ink">{c.name}</p>
                    <p className="text-xs text-muted">
                      {c.memberCount} {c.memberCount === 1 ? 'member' : 'members'}
                      {c.isOwner && ' · You own this'}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-16 text-center text-muted">
            No circles yet. Create one above to start sharing with a group.
          </p>
        )}
      </div>
    </MainLayout>
  );
}
