'use client';

import { ExclamationTriangleIcon, ArrowPathIcon, WifiIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';

export interface ErrorInfo {
  type: 'network' | 'server' | 'auth' | 'permission' | 'validation' | 'unknown';
  code?: number;
  message: string;
  details?: string;
  timestamp?: Date;
}

interface ErrorDisplayProps {
  error: ErrorInfo | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
  showRetryButton?: boolean;
  showDismissButton?: boolean;
  autoHide?: boolean;
  autoHideDelay?: number;
}

// 错误类型到图标的映射
const getErrorIcon = (type: ErrorInfo['type']) => {
  switch (type) {
    case 'network':
      return WifiIcon;
    case 'server':
    case 'auth':
    case 'permission':
    case 'validation':
    case 'unknown':
    default:
      return ExclamationTriangleIcon;
  }
};

// 错误类型到颜色的映射
const getErrorColors = (type: ErrorInfo['type']) => {
  switch (type) {
    case 'network':
      return {
        bg: 'bg-yellow-50 dark:bg-yellow-900/20',
        border: 'border-yellow-200 dark:border-yellow-800',
        icon: 'text-yellow-600 dark:text-yellow-400',
        text: 'text-yellow-800 dark:text-yellow-200',
      };
    case 'auth':
    case 'permission':
      return {
        bg: 'bg-red-50 dark:bg-red-900/20',
        border: 'border-red-200 dark:border-red-800',
        icon: 'text-red-600 dark:text-red-400',
        text: 'text-red-800 dark:text-red-200',
      };
    case 'server':
    case 'validation':
    case 'unknown':
    default:
      return {
        bg: 'bg-orange-50 dark:bg-orange-900/20',
        border: 'border-orange-200 dark:border-orange-800',
        icon: 'text-orange-600 dark:text-orange-400',
        text: 'text-orange-800 dark:text-orange-200',
      };
  }
};

// 错误类型到标题的映射
const getErrorTitle = (type: ErrorInfo['type']) => {
  switch (type) {
    case 'network':
      return '网络连接错误';
    case 'server':
      return '服务器错误';
    case 'auth':
      return '身份验证失败';
    case 'permission':
      return '权限不足';
    case 'validation':
      return '数据验证错误';
    case 'unknown':
    default:
      return '未知错误';
  }
};

// 错误类型到建议操作的映射
const getErrorSuggestion = (type: ErrorInfo['type']) => {
  switch (type) {
    case 'network':
      return '请检查您的网络连接，然后重试';
    case 'server':
      return '服务器暂时不可用，请稍后重试';
    case 'auth':
      return '请重新登录您的账户';
    case 'permission':
      return '您没有执行此操作的权限';
    case 'validation':
      return '请检查输入的信息是否正确';
    case 'unknown':
    default:
      return '发生了意外错误，请重试或联系支持';
  }
};

export default function ErrorDisplay({
  error,
  onRetry,
  onDismiss,
  className = '',
  showRetryButton = true,
  showDismissButton = false,
  autoHide = false,
  autoHideDelay = 5000,
}: ErrorDisplayProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoHide && error) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onDismiss?.();
      }, autoHideDelay);

      return () => clearTimeout(timer);
    }
  }, [error, autoHide, autoHideDelay, onDismiss]);

  if (!error || !isVisible) {
    return null;
  }

  const IconComponent = getErrorIcon(error.type);
  const colors = getErrorColors(error.type);
  const title = getErrorTitle(error.type);
  const suggestion = getErrorSuggestion(error.type);

  return (
    <div className={`rounded-md p-4 ${colors.bg} ${colors.border} border ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <IconComponent className={`h-5 w-5 ${colors.icon}`} aria-hidden="true" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${colors.text}`}>
            {title}
          </h3>
          <div className={`mt-2 text-sm ${colors.text.replace('800', '700').replace('200', '300')}`}>
            <p>{error.message || suggestion}</p>
            {error.details && (
              <details className="mt-2">
                <summary className="cursor-pointer hover:underline">
                  查看详情
                </summary>
                <p className="mt-1 text-xs opacity-80">{error.details}</p>
              </details>
            )}
            {error.code && (
              <p className="mt-1 text-xs opacity-60">
                错误代码: {error.code}
              </p>
            )}
          </div>
          
          {(showRetryButton || showDismissButton) && (
            <div className="mt-4">
              <div className="flex space-x-2">
                {showRetryButton && onRetry && (
                  <button
                    type="button"
                    onClick={onRetry}
                    className={`
                      inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium
                      ${colors.text} hover:bg-white/50 dark:hover:bg-black/20 
                      border border-current/20 hover:border-current/40
                      transition-colors duration-200
                    `}
                  >
                    <ArrowPathIcon className="mr-1.5 h-4 w-4" />
                    重试
                  </button>
                )}
                {showDismissButton && onDismiss && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsVisible(false);
                      onDismiss();
                    }}
                    className={`
                      inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium
                      ${colors.text} hover:bg-white/50 dark:hover:bg-black/20
                      border border-current/20 hover:border-current/40
                      transition-colors duration-200
                    `}
                  >
                    忽略
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 工具函数：从HTTP响应创建ErrorInfo
export const createErrorFromResponse = (response: Response, message?: string): ErrorInfo => {
  let type: ErrorInfo['type'] = 'unknown';
  
  if (!navigator.onLine) {
    type = 'network';
  } else if (response.status >= 500) {
    type = 'server';
  } else if (response.status === 401) {
    type = 'auth';
  } else if (response.status === 403) {
    type = 'permission';
  } else if (response.status >= 400 && response.status < 500) {
    type = 'validation';
  }

  return {
    type,
    code: response.status,
    message: message || `请求失败 (${response.status} ${response.statusText})`,
    timestamp: new Date(),
  };
};

// 工具函数：从Error对象创建ErrorInfo
export const createErrorFromException = (error: Error): ErrorInfo => {
  let type: ErrorInfo['type'] = 'unknown';
  
  if (error.name === 'NetworkError' || error.message.includes('network')) {
    type = 'network';
  } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
    type = 'network';
  }

  return {
    type,
    message: error.message || '发生了意外错误',
    details: error.stack,
    timestamp: new Date(),
  };
};