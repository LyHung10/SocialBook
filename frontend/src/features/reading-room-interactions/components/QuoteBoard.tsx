'use client';
import { useState } from 'react';
import { useReadingRoomStore } from '@/store/useReadingRoomStore';
import { useReadingRoomSocket } from '@/features/reading-rooms/hooks/useReadingRoomSocket';
import { useAppAuth } from '@/features/auth/hooks';
import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown, QuoteIcon } from 'lucide-react';

export function QuoteBoard() {
  const quotes = useReadingRoomStore((s) => s.quotes);
  const { user } = useAppAuth();
  const { voteQuote } = useReadingRoomSocket();

  if (quotes.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-muted-foreground italic">
        <QuoteIcon className="w-6 h-6 mx-auto mb-2 opacity-30" />
        Chưa có trích dẫn nào.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {quotes.map((quote) => {
        const userVote = quote.votes.find(v => v.userId === user?.id);

        return (
          <div
            key={quote.id}
            className="group p-3 rounded-2xl bg-background/40 border border-border/50 hover:border-primary/20 transition-colors"
          >
            <blockquote className="text-xs leading-relaxed text-foreground/80 italic border-l-2 border-primary/30 pl-3 mb-2">
              &ldquo;{quote.content}&rdquo;
            </blockquote>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span className="font-medium truncate">
                {quote.displayName || quote.userId.slice(0, 6)}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => voteQuote(quote.id, 'up')}
                  className={cn(
                    'p-1 rounded-md hover:bg-primary/10 transition-colors',
                    userVote?.type === 'up' && 'text-green-500',
                  )}
                  title="Ủng hộ"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <span className={cn(
                  'text-xs font-bold tabular-nums min-w-[1.5ch] text-center',
                  quote.voteCount > 0 && 'text-green-500',
                  quote.voteCount < 0 && 'text-red-500',
                )}>
                  {quote.voteCount}
                </span>
                <button
                  onClick={() => voteQuote(quote.id, 'down')}
                  className={cn(
                    'p-1 rounded-md hover:bg-primary/10 transition-colors',
                    userVote?.type === 'down' && 'text-red-500',
                  )}
                  title="Phản đối"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
