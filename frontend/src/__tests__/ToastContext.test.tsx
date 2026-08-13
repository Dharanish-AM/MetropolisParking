import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ToastProvider, useToast } from '../context/ToastContext';

const TestComponent = () => {
  const { showToast } = useToast();
  return (
    <div>
      <button onClick={() => showToast('Operation Successful', 'success')}>Show Success</button>
      <button onClick={() => showToast('Operation Failed', 'error')}>Show Error</button>
    </div>
  );
};

describe('ToastContext & ToastProvider', () => {
  it('displays success and error toast notifications on demand', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Show Success' }));
    expect(screen.getByText('Operation Successful')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Show Error' }));
    expect(screen.getByText('Operation Failed')).toBeInTheDocument();
  });

  it('dismisses toast notification on clicking dismiss button', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Show Success' }));
    expect(screen.getByText('Operation Successful')).toBeInTheDocument();

    const dismissBtn = screen.getByRole('button', { name: 'Dismiss notification' });
    fireEvent.click(dismissBtn);

    expect(screen.queryByText('Operation Successful')).not.toBeInTheDocument();
  });
});
