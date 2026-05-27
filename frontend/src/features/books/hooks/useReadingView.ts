import { useState, useEffect, useRef } from 'react';

export type ViewMode = 'read' | 'listen';

export interface UseReadingViewResult {
    viewMode: ViewMode;
    isControlsVisible: boolean;
    showTOC: boolean;
    showSettings: boolean;
    setViewMode: (mode: ViewMode) => void;
    setShowTOC: (show: boolean) => void;
    setShowSettings: (show: boolean) => void;
}

export function useReadingView(): UseReadingViewResult {
    const [viewMode, setViewMode] = useState<ViewMode>('read');
    const [showTOC, setShowTOC] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [isControlsVisible, setIsControlsVisible] = useState(true);
    const lastScrollYRef = useRef(0);
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        const handleScroll = () => {
            if (rafRef.current !== null) return;

            rafRef.current = requestAnimationFrame(() => {
                const currentScrollY = window.scrollY;
                const isScrollingDown = currentScrollY > lastScrollYRef.current;
                lastScrollYRef.current = currentScrollY;

                if (isScrollingDown && currentScrollY > 100) {
                    setIsControlsVisible(false);
                } else {
                    setIsControlsVisible(true);
                }

                rafRef.current = null;
            });
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, []);

    return {
        viewMode,
        isControlsVisible,
        showTOC,
        showSettings,
        setViewMode,
        setShowTOC,
        setShowSettings,
    };
}
