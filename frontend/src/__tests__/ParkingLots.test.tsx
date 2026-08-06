import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi } from 'vitest';
import { ParkingLotsFeature } from '../features/lots/components/ParkingLotsFeature';
import { AuthContext } from '../features/auth/context/AuthContext';
import { ToastProvider } from '../context/ToastContext';

const mockAuthValue = (role: 'ADMIN' | 'CUSTOMER') => ({
  user: { id: '1', name: 'User', email: 'user@test.com', role },
  token: 'mock-token',
  login: vi.fn(),
  logout: vi.fn(),
  checkAuth: vi.fn(),
  loading: false,
  error: null,
});

const renderWithQueryClient = (
  component: React.ReactNode,
  role: 'ADMIN' | 'CUSTOMER' = 'ADMIN'
) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <AuthContext.Provider value={mockAuthValue(role)}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>{component}</ToastProvider>
      </QueryClientProvider>
    </AuthContext.Provider>
  );
};

describe('ParkingLotsFeature Component', () => {
  it('renders parking lots list from MSW', async () => {
    renderWithQueryClient(<ParkingLotsFeature />);

    expect(screen.getByText(/Parking Lots & Floor Layouts/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Downtown Central')).toBeInTheDocument();
      expect(screen.getByText('Westside Plaza')).toBeInTheDocument();
    });
  });

  it('renders Add Lot button for ADMIN user', () => {
    renderWithQueryClient(<ParkingLotsFeature />, 'ADMIN');
    expect(screen.getByText(/Add Lot/i)).toBeInTheDocument();
  });
});
