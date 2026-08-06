import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { QrScannerPage } from '../pages/QrScannerPage';
import { AuthContext } from '../features/auth/context/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('html5-qrcode', () => {
  return {
    Html5Qrcode: vi.fn().mockImplementation(() => ({
      start: vi.fn().mockResolvedValue(undefined),
      stop: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn(),
      isScanning: false,
    })),
  };
});

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

  it('toggles camera scanner control', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={mockAdminAuth}>
          <BrowserRouter>
            <QrScannerPage />
          </BrowserRouter>
        </AuthContext.Provider>
      </QueryClientProvider>
    );

    const cameraBtn = screen.getByRole('button', { name: /Use Camera Scanner/i });
    expect(cameraBtn).toBeInTheDocument();

    fireEvent.click(cameraBtn);
    expect(screen.getByText(/Stop Camera/i)).toBeInTheDocument();
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

    fireEvent.change(textarea, {
      target: { value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.valid-qr-token' },
    });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/CHECKIN SUCCESSFUL/i)).toBeInTheDocument();
      expect(screen.getByText(/Gate opened for reserved space A-101/i)).toBeInTheDocument();
    });
  });

  it('renders ALREADY COMPLETED badge formatted correctly', async () => {
    const { server } = await import('../test/mocks/server');
    const { http, HttpResponse } = await import('msw');

    server.use(
      http.post('http://localhost:8080/qr/scan', () => {
        return HttpResponse.json({
          action: 'ALREADY_COMPLETED',
          entityId: 'res-111',
          entityType: 'RESERVATION',
          plateNumber: 'TN12LS1407',
          spaceNumber: 'L2-022',
          status: 'COMPLETED',
          message: 'Reservation for space L2-022 has already been checked in',
        });
      })
    );

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

    fireEvent.change(textarea, {
      target: { value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.completed-token' },
    });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('ALREADY COMPLETED')).toBeInTheDocument();
      expect(screen.getByText(/Reservation for space L2-022 has already been checked in/i)).toBeInTheDocument();
    });
  });
});
