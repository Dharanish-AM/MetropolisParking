import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { CustomerDashboard } from '../features/dashboard/components/CustomerDashboard';
import { AuthContext } from '../features/auth/context/AuthContext';

const mockAuthValue = {
  user: { id: 'cust-1', name: 'John Doe', email: 'john@example.com', role: 'CUSTOMER' as const },
  token: 'mock-token',
  login: vi.fn(),
  logout: vi.fn(),
  checkAuth: vi.fn(),
  loading: false,
  error: null,
};

const renderWithQueryClient = (component: React.ReactNode) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <AuthContext.Provider value={mockAuthValue}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>{component}</BrowserRouter>
      </QueryClientProvider>
    </AuthContext.Provider>
  );
};

describe('CustomerDashboard Component', () => {
  it('renders quick action cards and customer greeting', async () => {
    renderWithQueryClient(<CustomerDashboard />);

    expect(screen.getByText(/Welcome, John Doe/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/My Registered Vehicles/i)).toBeInTheDocument();
    });
  });
});
