import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { QrScannerPage } from '../pages/QrScannerPage';
import { AuthContext } from '../features/auth/context/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockAdminAuth = {
  user: { id: 'admin-id-123', name: 'Admin User', email: 'admin@metropolisparking.com', role: 'ADMIN' as const },
  token: 'mock-token',
  login: vi.fn(),
  logout: vi.fn(),
  checkAuth: vi.fn(),
  loading: false,
  error: null,
};

describe('QrScannerPage Component', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  it('renders QR scanner page title and input elements', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={mockAdminAuth}>
          <BrowserRouter>
            <QrScannerPage />
          </BrowserRouter>
        </AuthContext.Provider>
      </QueryClientProvider>
    );

    expect(screen.getByText(/QR Code Gate Entry & Passes/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Paste JWT QR Token payload here.../i)).toBeInTheDocument();
  });

  it('submits QR token string and renders MSW mock scan result', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={mockAdminAuth}>
          <BrowserRouter>
            <QrScannerPage />
          </BrowserRouter>
        </AuthContext.Provider>
      </QueryClientProvider>
    );

    const textarea = screen.getByPlaceholderText(/Paste JWT QR Token payload here.../i);
    const submitBtn = screen.getByRole('button', { name: /Validate & Open Gate/i });

    fireEvent.change(textarea, { target: { value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.valid-qr-token' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/CHECKIN SUCCESSFUL/i)).toBeInTheDocument();
      expect(screen.getByText(/Gate opened for reserved space A-101/i)).toBeInTheDocument();
    });
  });
});
