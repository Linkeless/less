'use client';

import React from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface ErrorInfo {
  componentStack: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  retryCount: number;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{
    error: Error;
    errorInfo: ErrorInfo | null;
    onRetry: () => void;
    retryCount: number;
  }>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  maxRetries?: number;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null;
  private prevResetKeys: Array<string | number> = [];

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
    };
    this.prevResetKeys = props.resetKeys || [];
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys } = this.props;
    const { hasError } = this.state;

    if (hasError && resetKeys) {
      const hasResetKeyChanged = resetKeys.some(
        (key, index) => key !== this.prevResetKeys[index]
      );

      if (hasResetKeyChanged) {
        this.resetErrorBoundary();
      }
      this.prevResetKeys = resetKeys;
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError } = this.props;
    
    this.setState({ errorInfo });

    // 记录错误到控制台和外部服务
    this.logError(error, errorInfo);

    // 调用外部错误处理函数
    onError?.(error, errorInfo);
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  logError = (error: Error, errorInfo: ErrorInfo) => {
    const { errorId } = this.state;
    
    console.error('ErrorBoundary caught an error:', {
      errorId,
      name: error.name,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
    });

    // 这里可以集成外部错误报告服务
    // 例如: Sentry, LogRocket, Bugsnag 等
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: error.message,
        fatal: false,
        error_id: errorId,
      });
    }
  };

  resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
    });
  };

  handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    const { retryCount } = this.state;

    if (retryCount < maxRetries) {
      this.setState((prevState) => ({
        retryCount: prevState.retryCount + 1,
      }));

      // 延迟重置以避免立即重新渲染错误
      this.resetTimeoutId = window.setTimeout(() => {
        this.resetErrorBoundary();
      }, 100);
    }
  };

  render() {
    const { hasError, error, errorInfo, retryCount } = this.state;
    const { children, fallback: Fallback, maxRetries = 3 } = this.props;

    if (hasError && error) {
      if (Fallback) {
        return <Fallback 
          error={error} 
          errorInfo={errorInfo} 
          onRetry={this.handleRetry}
          retryCount={retryCount}
        />;
      }

      return (
        <DefaultErrorFallback
          error={error}
          errorInfo={errorInfo}
          onRetry={this.handleRetry}
          retryCount={retryCount}
          maxRetries={maxRetries}
        />
      );
    }

    return children;
  }
}

// 默认错误回退组件
interface DefaultErrorFallbackProps {
  error: Error;
  errorInfo: ErrorInfo | null;
  onRetry: () => void;
  retryCount: number;
  maxRetries: number;
}

const DefaultErrorFallback: React.FC<DefaultErrorFallbackProps> = ({
  error,
  onRetry,
  retryCount,
  maxRetries,
}) => {
  const canRetry = retryCount < maxRetries;

  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mx-4">
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
          <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
        </div>
        
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            页面加载出错
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
            {error.message || '页面遇到了一个意外错误，请稍后重试'}
          </p>
          
          {retryCount > 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
              已重试 {retryCount} 次
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {canRetry && (
              <button
                onClick={onRetry}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors"
              >
                <ArrowPathIcon className="w-4 h-4 mr-2" />
                重试 ({maxRetries - retryCount} 次机会)
              </button>
            )}
            
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              刷新页面
            </button>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4 text-left">
              <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-600 dark:hover:text-gray-400">
                技术详情
              </summary>
              <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-auto max-h-32">
                {error.stack}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorBoundary;