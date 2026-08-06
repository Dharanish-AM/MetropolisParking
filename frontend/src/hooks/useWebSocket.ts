import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useWebSocket() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/api/ws`;

    let ws: WebSocket | null = null;
    let reconnectTimeoutId: number | null = null;
    let pingIntervalId: number | null = null;
    let retryCount = 0;
    let isComponentMounted = true;

    const connect = () => {
      if (!isComponentMounted) return;

      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        retryCount = 0;
        pingIntervalId = window.setInterval(() => {
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);
      };

      ws.onmessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          if (data.event === 'space_updated' || data.event === 'dashboard_updated') {
            queryClient.invalidateQueries();
          }
        } catch (err) {
          console.error(err);
        }
      };

      ws.onclose = () => {
        if (pingIntervalId) {
          clearInterval(pingIntervalId);
          pingIntervalId = null;
        }

        if (!isComponentMounted) return;

        const delay = Math.min(1000 * Math.pow(2, retryCount), 16000);
        retryCount += 1;

        reconnectTimeoutId = window.setTimeout(() => {
          connect();
        }, delay);
      };
    };

    connect();

    return () => {
      isComponentMounted = false;
      if (reconnectTimeoutId) clearTimeout(reconnectTimeoutId);
      if (pingIntervalId) clearInterval(pingIntervalId);
      if (ws) ws.close();
    };
  }, [queryClient]);
}
