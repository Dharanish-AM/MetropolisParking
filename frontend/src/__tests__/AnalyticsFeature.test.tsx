import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi } from 'vitest';
import { AnalyticsFeature } from '../features/analytics/AnalyticsFeature';
import { AuthContext } from '../features/auth/context/AuthContext';
import { ToastProvider } from '../context/ToastContext';

const mockAuthValue = {
  user: { id: 'admin-id-123', name: 'Admin', email: 'admin@test.com', role: 'ADMIN' as const },
  token: 'mock-token',
  login: vi.fn(),
  logout: vi.fn(),
  checkAuth: vi.fn(),
  loading: false,
  error: null,
};

const renderWithProviders = (component: React.ReactNode) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <AuthContext.Provider value={mockAuthValue}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>{component}</ToastProvider>
      </QueryClientProvider>
    </AuthContext.Provider>
  );
};

describe('AnalyticsFeature Component', () => {
  it('renders revenue analytics summary, trend chart, and lot breakdown from MSW', async () => {
    renderWithProviders(<AnalyticsFeature />);

    expect(screen.getByText(/Revenue & Occupancy Analytics/i)).toBeInTheDocument();
    const lots = await screen.findAllByText('Downtown Central');
    expect(lots.length).toBeGreaterThan(0);
  });
});
