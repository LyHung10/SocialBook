import { useState, useEffect, useCallback } from 'react';

interface UseOptimisticToggleOptions {
  initialCount: number;
  initialState: boolean;
  onToggle: () => Promise<unknown>;
  onError?: (error: unknown) => void;
}

export function useOptimisticToggle({
  initialCount,
  initialState,
  onToggle,
  onError,
}: UseOptimisticToggleOptions) {
  const [count, setCount] = useState(initialCount);
  const [isActive, setIsActive] = useState(initialState);

  useEffect(() => {
    setCount(initialCount);
    setIsActive(initialState);
  }, [initialCount, initialState]);

  const toggle = useCallback(async () => {
    const nextState = !isActive;
    
    setIsActive(nextState);
    setCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));

    try {
      await onToggle();
    } catch (error) {
      setIsActive(!nextState);
      setCount((prev) => (nextState ? Math.max(0, prev - 1) : prev + 1));
      onError?.(error);
    }
  }, [isActive, onToggle, onError]);

  return {
    count,
    isActive,
    toggle,
    setCount,
    setIsActive,
  };
}
