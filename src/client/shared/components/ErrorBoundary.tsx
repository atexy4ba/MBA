import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-charcoal-50 px-4">
          <div className="text-center max-w-md">
            <h1 className="font-heading text-2xl text-charcoal-900 mb-3">
              Une erreur est survenue
            </h1>
            <p className="text-sm text-charcoal-500 mb-6">
              {this.state.error?.message || 'Erreur inattendue.'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = '/fr';
              }}
              className="px-5 py-2.5 text-sm font-medium bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors"
            >
              Retour à l&rsquo;accueil
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
