import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 font-sans text-white">
          <Card className="max-w-sm w-full bg-zinc-900 border-zinc-800 text-center p-6 space-y-4 rounded-ios-lg shadow-ios-float">
            <div className="w-12 h-12 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto text-red-500">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h2 className="text-base font-bold text-white">Something went wrong</h2>
              <p className="text-xs text-zinc-400">
                An unexpected error occurred in the UI. Your travel data is safe in local storage.
              </p>
            </div>

            {this.state.error && (
              <div className="p-2.5 bg-black/60 rounded-ios-sm text-[11px] font-mono text-red-400 text-left overflow-x-auto max-h-24">
                {this.state.error.message}
              </div>
            )}

            <Button
              variant="ios"
              size="lg"
              onClick={this.handleReload}
              className="w-full text-xs font-bold h-11"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Reload Application
            </Button>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
