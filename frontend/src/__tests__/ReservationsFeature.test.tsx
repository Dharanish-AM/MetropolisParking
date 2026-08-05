import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi } from 'vitest';
import { ReservationsFeature } from '../features/reservations/components/ReservationsFeature';
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

describe('ReservationsFeature Component', () => {
  it('renders reservations feature header and cards from MSW', async () => {
    renderWithProviders(<ReservationsFeature />);

    expect(screen.getByText('Reservations')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Active & Past Bookings')).toBeInTheDocument();
    });
  });

  it('renders Book Space button', () => {
    renderWithProviders(<ReservationsFeature />);
    expect(screen.getByText('Book Space')).toBeInTheDocument();
  });
});
