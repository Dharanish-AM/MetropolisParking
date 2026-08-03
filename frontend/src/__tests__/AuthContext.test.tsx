import { render, screen, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { AuthProvider, useAuthContext } from '../features/auth/context/AuthContext';

const TestComponent = () => {
  const { user, login, logout } = useAuthContext();
  return (
    <div>
      <div data-testid="user-name">{user ? user.name : 'No User'}</div>
      <div data-testid="user-role">{user ? user.role : 'No Role'}</div>
      <button
        onClick={() =>
          login('mock-token', {
            id: '1',
            name: 'Admin User',
            email: 'admin@metropolisparking.com',
            role: 'ADMIN',
          })
        }
      >
        LogIn
      </button>
      <button onClick={logout}>LogOut</button>
    </div>
  );
};

describe('AuthContext Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('stores token and user state on login()', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user-name')).toBeInTheDocument();
    });

    await act(async () => {
      screen.getByText('LogIn').click();
    });

    expect(screen.getByTestId('user-name')).toHaveTextContent('Admin User');
    expect(localStorage.getItem('token')).toBe('mock-token');
  });

  it('clears localStorage and user state on logout()', async () => {
    localStorage.setItem('token', 'mock-token');

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user-name')).toHaveTextContent('Admin User');
    });

    await act(async () => {
      screen.getByText('LogOut').click();
    });

    expect(screen.getByTestId('user-name')).toHaveTextContent('No User');
    expect(localStorage.getItem('token')).toBeNull();
  });
});
