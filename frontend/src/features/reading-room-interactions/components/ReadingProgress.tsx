'use client';
import { useReadingRoomStore } from '@/store/useReadingRoomStore';
import { cn } from '@/lib/utils';

interface ReadingProgressProps {
  userId: string;
  displayName: string;
  avatarUrl?: string;
}

export function ReadingProgress({ userId, displayName, avatarUrl }: ReadingProgressProps) {
  const presences = useReadingRoomStore((s) => s.presences);
  const presence = presences[userId];
  const progress = presence?.progress || 0;

  return (
    <div className="relative shrink-0" title={`${displayName}: ${Math.round(progress)}%`}>
      <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-black text-primary overflow-hidden shadow-inner">
        {avatarUrl ? (
          <img src={avatarUrl} alt="Avatar" loading="lazy" width={40} height={40} className="w-full h-full object-cover" />
        ) : (
          displayName.charAt(0).toUpperCase()
        )}
      </div>
      {progress > 0 && (
        <svg className="absolute inset-0 w-10 h-10 -rotate-90" viewBox="0 0 40 40">
          <circle
            cx="20" cy="20" r="17"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-muted-foreground/20"
          />
          <circle
            cx="20" cy="20" r="17"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray={`${106.9 * (progress / 100)} 106.9`}
            strokeLinecap="round"
            className={cn(
              'transition-all duration-500',
              progress > 50 ? 'text-green-500' : progress > 20 ? 'text-yellow-500' : 'text-blue-500',
            )}
          />
        </svg>
      )}
      <div className={cn(
        'absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-background rounded-full',
        presence ? 'bg-green-500' : 'bg-muted-foreground/30',
      )} />
    </div>
  );
}
