import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled error caught by ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="min-h-screen flex flex-col items-center justify-center gap-4 bg-neutral-bg p-8 text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-status-occupied/10 text-status-occupied flex items-center justify-center">
            <AlertTriangle className="w-7 h-7" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-bold text-neutral-primary">Something went wrong</h1>
          <p className="text-sm text-neutral-secondary max-w-md">
            An unexpected error occurred. Try reloading the page — if the problem persists, contact
            your system administrator.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2.5 bg-brand-primary text-white rounded-xl text-sm font-semibold hover:bg-brand-primary/95 transition-all cursor-pointer"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
