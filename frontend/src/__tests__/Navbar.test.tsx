import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { Navbar } from '../components/Navbar';
import { AuthContext } from '../features/auth/context/AuthContext';

const mockAuthContext = (user: { id: string; name: string; email: string; role: 'ADMIN' | 'OPERATOR' | 'CUSTOMER' } | null) => ({
  user,
  token: user ? 'mock-token' : null,
  login: vi.fn(),
  logout: vi.fn(),
  checkAuth: vi.fn(),
  loading: false,
  error: null,
});

describe('Navbar Component', () => {
  it('renders logo and log in link when user is unauthenticated', () => {
    render(
      <AuthContext.Provider value={mockAuthContext(null)}>
        <BrowserRouter>
          <Navbar />
        </BrowserRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText(/Metropolis/i)).toBeInTheDocument();
    expect(screen.getByText(/Log in \/ Sign up/i)).toBeInTheDocument();
  });

  it('renders navigation links and user details when logged in as ADMIN', () => {
    const adminUser = {
      id: '1',
      name: 'Super Admin',
      email: 'admin@metropolisparking.com',
      role: 'ADMIN' as const,
    };

    render(
      <AuthContext.Provider value={mockAuthContext(adminUser)}>
        <BrowserRouter>
          <Navbar />
        </BrowserRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText('Super Admin')).toBeInTheDocument();
    expect(screen.getByText('ADMIN')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Parking Lots')).toBeInTheDocument();
    expect(screen.getByText('QR Gate Pass')).toBeInTheDocument();
  });
});
