import { useEffect, useRef, useState } from 'react';

export function useReadingRoomProgress(enabled: boolean = true): number {
  const [progress, setProgress] = useState(0);
  const lastSentRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollTop = window.scrollY;
          const docHeight = document.documentElement.scrollHeight - window.innerHeight;

          if (docHeight <= 0) {
            ticking = false;
            return;
          }

          const current = Math.round((scrollTop / docHeight) * 100);

          if (Math.abs(current - lastSentRef.current) > 5 || current === 100 || current === 0) {
            lastSentRef.current = current;
            setProgress(current);
          }

          ticking = false;
        });

        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [enabled]);

  return progress;
}
