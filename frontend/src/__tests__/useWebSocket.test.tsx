import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect } from 'vitest';
import { useWebSocket } from '../hooks/useWebSocket';
import React from 'react';

describe('useWebSocket Hook', () => {
  it('initializes without throwing error', () => {
    const queryClient = new QueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { unmount } = renderHook(() => useWebSocket(), { wrapper });
    expect(unmount).toBeDefined();
    unmount();
  });
});
