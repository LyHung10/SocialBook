'use client';
import { useState, useRef, useEffect } from 'react';
import throttle from 'lodash/throttle';

export function useReadingProgress() {
  const [readingParagraphId, setReadingParagraphId] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [readingProgress, setReadingProgress] = useState(0);

  useEffect(() => {
    const handleScroll = throttle(() => {
      if (!contentRef.current) return;
      const rect = contentRef.current.getBoundingClientRect();
      const contentTop = rect.top + window.scrollY;
      const contentHeight = contentRef.current.offsetHeight;
      const viewportHeight = window.innerHeight;
      const scrolledPast = Math.max(0, window.scrollY - contentTop);
      const totalScrollable = contentHeight - viewportHeight;
      if (totalScrollable <= 0) {
        setReadingProgress(window.scrollY >= contentTop ? 100 : 0);
        return;
      }
      setReadingProgress(Math.min(100, Math.round((scrolledPast / totalScrollable) * 100)));
    }, 500);

    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => {
      handleScroll.cancel();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return {
    readingProgress,
    readingParagraphId,
    contentRef,
    onActiveParagraphChange: setReadingParagraphId,
  };
}
