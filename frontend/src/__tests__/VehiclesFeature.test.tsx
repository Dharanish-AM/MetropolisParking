import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi } from 'vitest';
import { VehiclesFeature } from '../features/vehicles/components/VehiclesFeature';
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

describe('VehiclesFeature Component', () => {
  it('renders vehicles registry and table rows from MSW', async () => {
    renderWithProviders(<VehiclesFeature />);

    expect(screen.getByText('Vehicle Registry')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('MH12AB1234')).toBeInTheDocument();
    });
  });

  it('renders Register Vehicle button', () => {
    renderWithProviders(<VehiclesFeature />);
    expect(screen.getByText('Register Vehicle')).toBeInTheDocument();
  });
});
