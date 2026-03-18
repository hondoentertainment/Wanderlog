// @ts-nocheck
import React, { Component, ReactNode, ErrorInfo } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
    public readonly state: State = { hasError: false, error: null };

    constructor(props: Props) {
        super(props);
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    handleRetry = (): void => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    render(): ReactNode {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-[#14181c] flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-[#1b2228] p-8 rounded-lg border border-[#2c3440] text-center">
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <i className="fas fa-exclamation-triangle text-2xl text-red-400"></i>
                        </div>

                        <h1 className="text-xl font-bold text-white mb-2">Something went wrong</h1>
                        <p className="text-[#9ab] text-sm mb-6">
                            We encountered an unexpected error. Please try refreshing the page.
                        </p>

                        <button
                            onClick={this.handleRetry}
                            className="w-full bg-[#00e054] text-[#14181c] font-bold py-3 px-6 rounded-lg hover:bg-[#00c030] transition-colors"
                        >
                            <i className="fas fa-redo mr-2"></i>
                            Refresh Page
                        </button>

                        <details className="mt-6 text-left">
                            <summary className="text-[#567] text-xs cursor-pointer hover:text-[#9ab]">
                                Technical Details
                            </summary>
                            <div className="mt-2 p-3 bg-[#14181c] rounded text-[10px] text-red-400 font-mono overflow-auto max-h-32">
                                <p>{this.state.error?.toString()}</p>
                            </div>
                        </details>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
