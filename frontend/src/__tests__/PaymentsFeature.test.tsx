import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi } from 'vitest';
import { PaymentsFeature } from '../features/payments/components/PaymentsFeature';
import { AuthContext } from '../features/auth/context/AuthContext';

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
      <QueryClientProvider client={queryClient}>{component}</QueryClientProvider>
    </AuthContext.Provider>
  );
};

describe('PaymentsFeature Component', () => {
  it('renders payment ledger table and rows from MSW', async () => {
    renderWithProviders(<PaymentsFeature />);

    expect(screen.getByText(/Payments/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('$15.00')).toBeInTheDocument();
    });
  });
});
