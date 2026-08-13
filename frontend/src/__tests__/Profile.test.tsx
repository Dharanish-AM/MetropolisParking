import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi } from 'vitest';
import { Profile } from '../pages/Profile';
import { AuthContext } from '../features/auth/context/AuthContext';

const mockAuthValue = {
  user: {
    id: 'cust-id-123',
    name: 'John Customer',
    email: 'john@example.com',
    role: 'CUSTOMER' as const,
  },
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

describe('Profile Page Component', () => {
  it('renders user details and profile info correctly', () => {
    renderWithProviders(<Profile />);

    expect(screen.getByText('My Profile')).toBeInTheDocument();
    expect(screen.getAllByText('John Customer').length).toBeGreaterThan(0);
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('CUSTOMER')).toBeInTheDocument();
  });
});
