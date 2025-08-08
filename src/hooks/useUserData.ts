'use client';

import { useState, useEffect, useCallback } from 'react';
import type { UserInfoResponse, Subscription } from '@/lib/types';
import {
  getUserInfo,
  getSubscription,
  resetUUID as resetUUIDAction,
} from '@/lib/client';
import { useApiErrorHandler } from '@/hooks/useErrorHandler';
import type { ErrorInfo } from '@/components/error/ErrorDisplay';

export interface UseUserDataReturn {
  userInfo: UserInfoResponse | null;
  loadingUserInfo: boolean;
  userInfoError: ErrorInfo | null;
  subscription: Subscription | null;
  loadingSubscription: boolean;
  subscriptionError: ErrorInfo | null;
  handleResetUUID: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  retryUserInfo: () => Promise<void>;
  retrySubscription: () => Promise<void>;
  clearErrors: () => void;
}

export function useUserData(): UseUserDataReturn {
  const [userInfo, setUserInfo] = useState<UserInfoResponse | null>(null);
  const [loadingUserInfo, setLoadingUserInfo] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);

  // 分别为用户信息和订阅信息创建错误处理器
  const userInfoErrorHandler = useApiErrorHandler({
    maxRetries: 2,
    retryDelay: 2000,
    onError: (error) => {
      console.error('用户信息获取失败:', error);
    }
  });

  const subscriptionErrorHandler = useApiErrorHandler({
    maxRetries: 2,
    retryDelay: 1500,
    onError: (error) => {
      console.error('订阅信息获取失败:', error);
    }
  });

  // 获取用户信息
  const fetchUserInfo = useCallback(async () => {
    setLoadingUserInfo(true);
    userInfoErrorHandler.clearError();
    
    const result = await userInfoErrorHandler.withApiErrorHandling(
      () => getUserInfo(),
      '获取用户信息失败'
    );

    if (result && result.code === 0 && result.data) {
      setUserInfo(result as UserInfoResponse);
    } else {
      setUserInfo(null);
    }
    
    setLoadingUserInfo(false);
  }, []);

  // 获取订阅信息
  const fetchSubscription = useCallback(async () => {
    setLoadingSubscription(true);
    subscriptionErrorHandler.clearError();
    
    const result = await subscriptionErrorHandler.withApiErrorHandling(
      () => getSubscription(undefined, 100, 0),
      '获取订阅信息失败'
    );

    if (result && result.code === 0 && result.data) {
      setSubscription(result);
    } else {
      setSubscription(null);
    }
    
    setLoadingSubscription(false);
  }, []);

  // 初始化数据获取
  const fetchInitialData = useCallback(async () => {
    // 并行获取用户信息和订阅信息
    await Promise.all([
      fetchUserInfo(),
      fetchSubscription(),
    ]);
  }, [fetchUserInfo, fetchSubscription]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // 重置UUID
  const handleResetUUID = useCallback(async () => {
    if (!userInfo) return;
    
    const result = await userInfoErrorHandler.withApiErrorHandling(
      () => resetUUIDAction(),
      '重置UUID失败'
    );

    if (result && result.code === 0 && result.data) {
      setUserInfo((prev) => {
        if (prev && prev.data) {
          return {
            ...prev,
            data: {
              ...prev.data,
              uuid: result.data.uuid,
            },
          };
        }
        return prev;
      });
    }
  }, [userInfo, userInfoErrorHandler.withApiErrorHandling]);

  // 刷新订阅信息
  const refreshSubscription = useCallback(async () => {
    await fetchSubscription();
  }, [fetchSubscription]);

  // 重试获取用户信息
  const retryUserInfo = useCallback(async () => {
    await userInfoErrorHandler.retry();
    if (!userInfoErrorHandler.error) {
      await fetchUserInfo();
    }
  }, [userInfoErrorHandler.retry, userInfoErrorHandler.error, fetchUserInfo]);

  // 重试获取订阅信息
  const retrySubscription = useCallback(async () => {
    await subscriptionErrorHandler.retry();
    if (!subscriptionErrorHandler.error) {
      await fetchSubscription();
    }
  }, [subscriptionErrorHandler.retry, subscriptionErrorHandler.error, fetchSubscription]);

  // 清除所有错误
  const clearErrors = useCallback(() => {
    userInfoErrorHandler.clearError();
    subscriptionErrorHandler.clearError();
  }, [userInfoErrorHandler.clearError, subscriptionErrorHandler.clearError]);

  return {
    userInfo,
    loadingUserInfo,
    userInfoError: userInfoErrorHandler.error,
    subscription,
    loadingSubscription,
    subscriptionError: subscriptionErrorHandler.error,
    handleResetUUID,
    refreshSubscription,
    retryUserInfo,
    retrySubscription,
    clearErrors,
  };
} 