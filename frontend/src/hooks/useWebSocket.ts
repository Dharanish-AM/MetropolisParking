import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useWebSocket() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/api/ws`;

    let ws = new WebSocket(wsUrl);

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.event === 'space_updated' || data.event === 'dashboard_updated') {
          queryClient.invalidateQueries();
        }
      } catch (err) {
        console.error(err);
      }
    };

    const handleClose = () => {
      setTimeout(() => {
        ws = new WebSocket(wsUrl);
        ws.onmessage = handleMessage;
        ws.onclose = handleClose;
      }, 3000);
    };

    ws.onmessage = handleMessage;
    ws.onclose = handleClose;

    return () => {
      ws.close();
    };
  }, [queryClient]);
}
