import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi } from 'vitest';
import { SessionsFeature } from '../features/sessions/components/SessionsFeature';
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

describe('SessionsFeature Component', () => {
  it('renders sessions feature header and sessions table from MSW', async () => {
    renderWithProviders(<SessionsFeature />);

    expect(screen.getByText('Parking Sessions')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('All Sessions')).toBeInTheDocument();
    });
  });

  it('renders start session button', () => {
    renderWithProviders(<SessionsFeature />);
    expect(screen.getByText('Start Session')).toBeInTheDocument();
  });
});
