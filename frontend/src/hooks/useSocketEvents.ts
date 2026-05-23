import { useEffect } from 'react';

export function useSocketEvents(
  socket: any,
  events: Record<string, (...args: any[]) => void>,
  dependencies: any[] = []
) {
  useEffect(() => {
    if (!socket) return;

    Object.entries(events).forEach(([eventName, handler]) => {
      socket.on(eventName, handler);
    });

    return () => {
      Object.entries(events).forEach(([eventName, handler]) => {
        socket.off(eventName, handler);
      });
    };
  }, [socket, ...dependencies]);
}
