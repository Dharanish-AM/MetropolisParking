import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { AnprSimulator } from '../pages/AnprSimulator';
import { AuthContext } from '../features/auth/context/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ToastProvider } from '../context/ToastContext';

const mockAdminAuth = {
  user: {
    id: 'admin-id-123',
    name: 'Admin User',
    email: 'admin@metropolisparking.com',
    role: 'ADMIN' as const,
  },
  token: 'mock-token',
  login: vi.fn(),
  logout: vi.fn(),
  checkAuth: vi.fn(),
  loading: false,
  error: null,
};

vi.mock('tesseract.js', () => ({
  default: {
    createWorker: vi.fn().mockResolvedValue({
      setParameters: vi.fn(),
      recognize: vi.fn().mockResolvedValue({ data: { text: 'MH-12-AB-1234' } }),
      terminate: vi.fn(),
    }),
    recognize: vi.fn().mockResolvedValue({ data: { text: 'MH-12-AB-1234' } }),
    PSM: {
      SINGLE_LINE: '7',
    },
  },
}));

describe('AnprSimulator Component', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  it('renders ANPR camera simulator page with title and sections', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthContext.Provider value={mockAdminAuth}>
            <BrowserRouter>
              <AnprSimulator />
            </BrowserRouter>
          </AuthContext.Provider>
        </ToastProvider>
      </QueryClientProvider>
    );

    expect(screen.getByText(/ANPR Camera Simulator/i)).toBeInTheDocument();
    expect(screen.getByText(/Camera Source/i)).toBeInTheDocument();
    expect(screen.getByText(/Gate Operation Console/i)).toBeInTheDocument();
  });
});
