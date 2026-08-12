'use client';

import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[ErrorBoundary]', error, info.componentStack);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center gap-6 px-8 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-rose-500/10">
            <AlertTriangle className="h-10 w-10 text-rose-400" aria-hidden />
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold text-white">
              Something went wrong
            </h2>
            <p className="mt-2 text-sm text-white/50">
              An unexpected error occurred. Please try again.
            </p>
          </div>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <pre className="max-w-lg rounded-xl border border-rose-500/20 bg-rose-500/5 px-5 py-3.5 text-xs text-rose-300 break-all">
              {this.state.error.message}
            </pre>
          )}
          <button
            type="button"
            onClick={this.handleReset}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-500/20 px-5 py-2.5 text-sm font-semibold text-sky-300 transition hover:bg-sky-500/30"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
