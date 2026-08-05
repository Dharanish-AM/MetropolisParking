import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi } from 'vitest';
import { AdminDashboard } from '../features/dashboard/components/AdminDashboard';
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

describe('AdminDashboard Component', () => {
  it('renders dashboard stat tiles and values from MSW', async () => {
    renderWithProviders(<AdminDashboard />);

    expect(screen.getByText('Occupancy Rate')).toBeInTheDocument();
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('62.5%')).toBeInTheDocument();
    });
  });
});
