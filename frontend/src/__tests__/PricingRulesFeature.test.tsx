import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi } from 'vitest';
import { PricingRulesFeature } from '../features/pricing/PricingRulesFeature';
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

describe('PricingRulesFeature Component', () => {
  it('renders dynamic pricing header, calculator, and rule table from MSW', async () => {
    renderWithProviders(<PricingRulesFeature />);

    expect(screen.getByText(/Dynamic Pricing & Rate Rules/i)).toBeInTheDocument();
    expect(screen.getByText(/Dynamic Fee Simulator/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Peak Surge/i)).toBeInTheDocument();
      expect(screen.getByText('₹50.00')).toBeInTheDocument();
    });
  });
});
