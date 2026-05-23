'use client';
import { useState, useRef, useEffect } from 'react';
import { useReadingRoomStore } from '@/store/useReadingRoomStore';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { useAppAuth } from '@/features/auth/hooks';

interface RoomChatProps {
  sendChatMessage: (content: string) => void;
  disabled?: boolean;
}

export function RoomChat({ sendChatMessage, disabled }: RoomChatProps) {
  const [text, setText] = useState('');
  const chatMessages = useReadingRoomStore((s) => s.chatMessages);
  const { user } = useAppAuth();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector<HTMLElement>(
      '[data-radix-scroll-area-viewport]',
    );
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  }, [chatMessages.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    sendChatMessage(text.trim());
    setText('');
    inputRef.current?.focus({ preventScroll: true });
  };

  const userMessages = chatMessages.filter((m) => m.role === 'user');

  return (
    <div className="flex flex-col h-[50vh] bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-border/60 dark:border-border rounded-3xl overflow-hidden shadow-lg dark:shadow-xl">
      <div className="px-5 py-4 border-b border-border/60 dark:border-border bg-primary/[0.03] dark:bg-muted/30">
        <h3 className="text-sm font-bold tracking-tight uppercase">Trò chuyện</h3>
      </div>

      <ScrollArea ref={scrollAreaRef} className="flex-1 p-3">
        {userMessages.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground italic">
            Chưa có tin nhắn nào
          </div>
        ) : (
          <div className="space-y-2">
            {userMessages.map((msg, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 p-2.5 rounded-2xl bg-black/[0.03] dark:bg-white/5 hover:bg-black/[0.05] dark:hover:bg-white/10 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                  {msg.avatarUrl ? (
                    <img
                      src={msg.avatarUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs font-bold text-primary">
                      {(msg.displayName || msg.userId).charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[11px] font-bold text-foreground">
                      {msg.userId === user?.id ? 'Bạn' : (msg.displayName || msg.userId.slice(0, 6))}
                    </span>
                    <span className="text-[9px] text-muted-foreground/60">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-foreground/90 mt-0.5 leading-relaxed break-words">{msg.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <form onSubmit={handleSubmit} className="p-3 border-t border-border/60 dark:border-border bg-black/[0.02] dark:bg-white/5">
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={disabled ? 'Phòng đã kết thúc' : 'Nhập tin nhắn...'}
            disabled={disabled}
            className="h-9 text-xs rounded-xl bg-background dark:bg-black/40 border-border/50 focus-visible:ring-primary/20"
          />
          <Button
            type="submit"
            size="icon"
            className="h-9 w-9 shrink-0 rounded-xl"
            disabled={disabled || !text.trim()}
          >
            <Send size={14} />
          </Button>
        </div>
      </form>
    </div>
  );
}
