import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Uncaught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
          <h1 className="font-display text-2xl text-primary">Something went wrong</h1>
          <p className="text-sm text-muted">Please reload the app.</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-gold-light"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
