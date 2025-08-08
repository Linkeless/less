'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import { ErrorInfo, createErrorFromResponse, createErrorFromException } from '@/components/error/ErrorDisplay';

interface UseErrorHandlerOptions {
  maxRetries?: number;
  retryDelay?: number;
  exponentialBackoff?: boolean;
  onError?: (error: ErrorInfo) => void;
  autoHide?: boolean;
  autoHideDelay?: number;
}

interface UseErrorHandlerReturn {
  error: ErrorInfo | null;
  isRetrying: boolean;
  retryCount: number;
  setError: (error: ErrorInfo | null) => void;
  handleError: (error: Error | Response, customMessage?: string) => void;
  retry: () => Promise<void>;
  clearError: () => void;
  withErrorHandling: <T>(
    asyncFn: () => Promise<T>,
    customMessage?: string
  ) => Promise<T | null>;
}

export function useErrorHandler(
  options: UseErrorHandlerOptions = {}
): UseErrorHandlerReturn {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    exponentialBackoff = true,
    onError,
    autoHide = false,
    autoHideDelay = 5000,
  } = options;

  const [error, setErrorState] = useState<ErrorInfo | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  const retryCallbackRef = useRef<(() => Promise<any>) | null>(null);
  const autoHideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const setError = useCallback((error: ErrorInfo | null) => {
    setErrorState(error);
    
    // 清除之前的自动隐藏定时器
    if (autoHideTimeoutRef.current) {
      clearTimeout(autoHideTimeoutRef.current);
      autoHideTimeoutRef.current = null;
    }
    
    // 如果设置了错误且启用自动隐藏，则设置定时器
    if (error && autoHide) {
      autoHideTimeoutRef.current = setTimeout(() => {
        setErrorState(null);
      }, autoHideDelay);
    }

    // 调用外部错误处理函数
    if (error && onError) {
      onError(error);
    }
  }, [autoHide, autoHideDelay, onError]);

  const handleError = useCallback((error: Error | Response, customMessage?: string) => {
    let errorInfo: ErrorInfo;
    
    if (error instanceof Response) {
      errorInfo = createErrorFromResponse(error, customMessage);
    } else {
      errorInfo = createErrorFromException(error);
      if (customMessage) {
        errorInfo.message = customMessage;
      }
    }
    
    setError(errorInfo);
    
    // 记录错误到控制台
    console.error('Error handled by useErrorHandler:', {
      type: errorInfo.type,
      message: errorInfo.message,
      code: errorInfo.code,
      details: errorInfo.details,
      timestamp: errorInfo.timestamp,
    });
  }, [setError]);

  const retry = useCallback(async () => {
    if (!retryCallbackRef.current || retryCount >= maxRetries || isRetrying) {
      return;
    }

    setIsRetrying(true);
    
    try {
      // 计算重试延迟
      const delay = exponentialBackoff 
        ? retryDelay * Math.pow(2, retryCount)
        : retryDelay;
      
      // 等待延迟
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      // 执行重试
      await retryCallbackRef.current();
      
      // 成功后清除错误和重置重试计数
      setError(null);
      setRetryCount(0);
    } catch (retryError) {
      // 重试失败，增加重试计数
      setRetryCount(prev => prev + 1);
      
      // 如果重试次数未超限，保持当前错误状态
      // 如果超限，更新错误信息
      if (retryCount + 1 >= maxRetries) {
        const errorMsg = retryError instanceof Error 
          ? retryError.message 
          : '重试失败，请稍后再试';
        handleError(retryError as Error, `${errorMsg} (已重试${retryCount + 1}次)`);
      }
    } finally {
      setIsRetrying(false);
    }
  }, [retryCount, maxRetries, isRetrying, retryDelay, exponentialBackoff, setError, handleError]);

  const clearError = useCallback(() => {
    setError(null);
    setRetryCount(0);
    retryCallbackRef.current = null;
    
    if (autoHideTimeoutRef.current) {
      clearTimeout(autoHideTimeoutRef.current);
      autoHideTimeoutRef.current = null;
    }
  }, [setError]);

  const withErrorHandling = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    customMessage?: string
  ): Promise<T | null> => {
    // 保存重试回调
    retryCallbackRef.current = async () => {
      await asyncFn();
    };

    try {
      const result = await asyncFn();
      
      // 成功执行后清除错误状态
      if (error) {
        clearError();
      }
      
      return result;
    } catch (caughtError) {
      handleError(caughtError as Error, customMessage);
      return null;
    }
  }, [error, handleError, clearError]);

  return {
    error,
    isRetrying,
    retryCount,
    setError,
    handleError,
    retry,
    clearError,
    withErrorHandling,
  };
}

// 专门用于API请求的错误处理hook
export function useApiErrorHandler(options: UseErrorHandlerOptions = {}) {
  const errorHandler = useErrorHandler({
    maxRetries: 2,
    retryDelay: 1500,
    exponentialBackoff: true,
    autoHide: false,
    ...options,
  });

  const handleApiError = useCallback((response: Response, customMessage?: string) => {
    const message = customMessage || `API请求失败 (${response.status})`;
    errorHandler.handleError(response, message);
  }, [errorHandler.handleError]);

  const withApiErrorHandling = useCallback(async <T>(
    apiFn: () => Promise<T>,
    customMessage?: string
  ): Promise<T | null> => {
    return errorHandler.withErrorHandling(apiFn, customMessage);
  }, [errorHandler.withErrorHandling]);

  // 使用 useMemo 稳定返回对象的引用
  return useMemo(() => ({
    ...errorHandler,
    handleApiError,
    withApiErrorHandling,
  }), [
    errorHandler.error,
    errorHandler.isRetrying,
    errorHandler.retryCount,
    errorHandler.setError,
    errorHandler.handleError,
    errorHandler.retry,
    errorHandler.clearError,
    errorHandler.withErrorHandling,
    handleApiError,
    withApiErrorHandling,
  ]);
}