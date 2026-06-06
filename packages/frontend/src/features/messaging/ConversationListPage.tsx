import { Link } from 'react-router-dom';
import { Loader2, MessageCircle } from 'lucide-react';
import { MainLayout } from '@/components/layout';
import { thumbImageUrl } from '@/lib/media';
import { useConversations } from './api';
import { formatWhen } from './format';

export function ConversationListPage() {
  const { data: conversations, isLoading, isError } = useConversations();

  return (
    <MainLayout>
      <h1 className="mb-4 font-display text-2xl text-ink md:text-3xl">Messages</h1>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      ) : isError ? (
        <p className="py-20 text-center font-display italic text-muted">Couldn’t load your messages. Please try again.</p>
      ) : conversations && conversations.length > 0 ? (
        <div className="mx-auto max-w-2xl divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
          {conversations.map((c) => {
            const name = c.other?.displayName ?? 'Unknown';
            const title = c.item?.name ?? name;
            const thumb = c.item?.thumb ? thumbImageUrl(c.item.thumb) : null;
            const lastBody = c.lastMessage
              ? `${c.lastMessage.fromMe ? 'You: ' : ''}${c.lastMessage.body}`
              : 'New conversation';
            const subtitle = `${name} · ${lastBody}`;
            const unread = c.unreadCount > 0;

            return (
              <Link
                key={c._id}
                to={`/messages/${c._id}`}
                className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-cream/60"
              >
                {thumb ? (
                  <img
                    src={thumb}
                    alt=""
                    className="h-11 w-11 flex-none rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-11 w-11 flex-none items-center justify-center rounded-lg bg-primary font-bold text-gold-light">
                    {name.charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className={`truncate ${unread ? 'font-bold text-ink' : 'font-semibold text-ink'}`}>
                      {title}
                    </span>
                    <span className="flex-none text-xs text-muted">{formatWhen(c.lastMessageAt)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`truncate text-sm ${unread ? 'text-ink/80' : 'text-muted'}`}>
                      {subtitle}
                    </span>
                    {unread && (
                      <span className="flex h-5 min-w-5 flex-none items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-bold text-white">
                        {c.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <MessageCircle className="h-10 w-10 text-muted/60" />
          <p className="text-lg font-display italic text-muted">
            No messages yet - but your next great borrow is one conversation away.
          </p>
        </div>
      )}
    </MainLayout>
  );
}
