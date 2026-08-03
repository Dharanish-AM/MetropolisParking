import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { AuthContext } from '../features/auth/context/AuthContext';

const mockAuthValue = (
  user: { id: string; name: string; email: string; role: 'ADMIN' | 'CUSTOMER' } | null,
  loading = false
) => ({
  user,
  token: user ? 'mock-token' : null,
  login: vi.fn(),
  logout: vi.fn(),
  checkAuth: vi.fn(),
  loading,
  error: null,
});

describe('ProtectedRoute Component', () => {
  it('redirects unauthenticated user to /login', () => {
    render(
      <AuthContext.Provider value={mockAuthValue(null)}>
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path="/login" element={<div>Login Page</div>} />
            <Route
              path="/protected"
              element={
                <ProtectedRoute>
                  <div>Protected Content</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('renders children when authenticated with matching role', () => {
    const adminUser = { id: '1', name: 'Admin', email: 'admin@test.com', role: 'ADMIN' as const };

    render(
      <AuthContext.Provider value={mockAuthValue(adminUser)}>
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route
              path="/protected"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <div>Admin Only Content</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText('Admin Only Content')).toBeInTheDocument();
  });

  it('redirects to /unauthorized when user role does not match', () => {
    const customerUser = {
      id: '2',
      name: 'Cust',
      email: 'cust@test.com',
      role: 'CUSTOMER' as const,
    };

    render(
      <AuthContext.Provider value={mockAuthValue(customerUser)}>
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path="/unauthorized" element={<div>Unauthorized Page</div>} />
            <Route
              path="/protected"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <div>Admin Only Content</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText('Unauthorized Page')).toBeInTheDocument();
  });
});
