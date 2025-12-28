// src/shared/components/common/ErrorBoundary.tsx
// NyayaSahayak - Error Boundary for Graceful Error Handling
// Ensures citizens always see a helpful message, never a blank screen

import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallbackMessage?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    private handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    private handleGoHome = () => {
        window.location.href = '/';
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-[400px] flex items-center justify-center p-8">
                    <div className="max-w-md w-full text-center bg-slate-800/80 backdrop-blur-xl rounded-3xl p-8 border border-slate-700 shadow-2xl">
                        {/* Error Icon */}
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                            <AlertTriangle className="w-10 h-10 text-amber-400" />
                        </div>

                        {/* Hindi + English Message */}
                        <h2 className="text-2xl font-bold text-white mb-2">
                            कुछ गलत हो गया
                        </h2>
                        <p className="text-slate-400 mb-4">
                            Something went wrong
                        </p>

                        <p className="text-sm text-slate-500 mb-6">
                            {this.props.fallbackMessage ||
                                "चिंता न करें। कृपया पुनः प्रयास करें।"}
                        </p>
                        <p className="text-xs text-slate-500 mb-8">
                            Don't worry. Please try again.
                        </p>

                        {/* Action Buttons */}
                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={this.handleRetry}
                                className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 hover:-translate-y-0.5"
                            >
                                <RefreshCw className="w-4 h-4" />
                                पुनः प्रयास करें
                            </button>
                            <button
                                onClick={this.handleGoHome}
                                className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-all"
                            >
                                <Home className="w-4 h-4" />
                                होम
                            </button>
                        </div>

                        {/* Error details for developers (hidden in production-like styling) */}
                        {import.meta.env.DEV && this.state.error && (
                            <details className="mt-8 text-left">
                                <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-400">
                                    Technical Details (Dev Only)
                                </summary>
                                <pre className="mt-2 p-3 bg-slate-900 rounded-lg text-xs text-red-400 overflow-auto max-h-32">
                                    {this.state.error.message}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
