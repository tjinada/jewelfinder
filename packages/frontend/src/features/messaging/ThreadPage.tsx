import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Send } from 'lucide-react';
import { GlassSurface } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { thumbImageUrl } from '@/lib/media';
import { cn } from '@/lib/utils';
import { PushNotificationPrompt } from '@/features/notifications';
import { useThread, useSendMessage } from './api';
import { formatTime } from './format';

export function ThreadPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const meId = useAuthStore((s) => s.user?.id);

  const { data: thread, isLoading, isError } = useThread(id);
  const send = useSendMessage(id ?? '');

  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the newest message.
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread?.messages.length]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setText('');
    send.mutate(body);
  };

  return (
    <div className="flex h-[100dvh] flex-col bg-cream">
      {/* Header */}
      <GlassSurface
        as="header"
        className="sticky top-0 z-20 rounded-none border-x-0 border-t-0 safe-top"
      >
        <div className="flex h-14 items-center gap-3 px-3">
          <button
            onClick={() => navigate('/messages')}
            aria-label="Back to messages"
            className="flex h-9 w-9 flex-none items-center justify-center rounded-full text-ink hover:bg-ink/5"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-primary text-sm font-bold text-gold-light">
            {(thread?.other?.displayName ?? '?').charAt(0).toUpperCase()}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-ink">
              {thread?.other?.displayName ?? 'Conversation'}
            </p>
            {thread?.item && (
              <Link
                to={`/item/${thread.item.id}`}
                className="truncate text-xs text-primary hover:underline"
              >
                About {thread.item.name}
              </Link>
            )}
          </div>

          {thread?.item?.thumb && (
            <Link to={`/item/${thread.item.id}`} className="flex-none">
              <img
                src={thumbImageUrl(thread.item.thumb)}
                alt=""
                className="h-9 w-9 rounded-lg object-cover"
              />
            </Link>
          )}
        </div>
      </GlassSurface>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        ) : isError ? (
          <p className="py-20 text-center text-muted">Couldn’t load this conversation.</p>
        ) : thread && thread.messages.length > 0 ? (
          <div className="mx-auto flex max-w-2xl flex-col gap-2">
            {thread.messages.map((m) => {
              const mine = m.sender === meId;
              return (
                <div key={m._id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                  <div
                    className={cn(
                      'max-w-[78%] rounded-2xl px-3.5 py-2 text-sm',
                      mine
                        ? 'rounded-br-md bg-primary text-gold-light'
                        : 'rounded-bl-md border border-line bg-surface text-ink',
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words">{m.body}</p>
                    <p className={cn('mt-1 text-[10px]', mine ? 'text-gold-light/70' : 'text-muted')}>
                      {formatTime(m.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>
        ) : (
          <p className="py-20 text-center text-muted">
            Say hello{thread?.other ? ` to ${thread.other.displayName}` : ''} — no messages yet.
          </p>
        )}
      </div>

      <PushNotificationPrompt />

      {/* Composer */}
      <form
        onSubmit={onSubmit}
        className="flex items-end gap-2 border-t border-line bg-surface px-3 py-3 safe-bottom"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message…"
          className="flex-1 rounded-2xl border border-line bg-cream/60 px-4 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          aria-label="Send"
          className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-primary text-gold-light disabled:opacity-40"
        >
          <Send className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}
