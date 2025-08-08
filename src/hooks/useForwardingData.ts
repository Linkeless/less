'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { UserInfo } from '@/lib/types'; // UserInfo is needed from UserInfoResponse.data
import {
  getForwardUsers,
  createForwardUser,
  updateForwardUser,
  fetchAdminShopPlans,
} from '@/lib/client';
import { env } from '@/env.config';
import { useToast } from '@/components/ui/Toast';

// Define a more specific type for ForwardingUser if available
// For now, using 'any' as it was in the original component
export type ForwardingUser = any;

export interface UseForwardingDataReturn {
  forwardingUser: ForwardingUser | null;
  forwardingEnabled: boolean;
  isForwardingAllowedForPlan: boolean;
  handleEnableForwarding: () => Promise<void>;
  handleSyncForwardingUser: () => Promise<void>;
  loadingForwardingData: boolean;
  // No need to return setters if all updates are via these handlers or page reloads
}

interface UseForwardingDataProps {
  userInfo: UserInfo | null; // Pass only the data part of UserInfoResponse
  isUserInfoLoading: boolean; // To prevent running effects too early
}

export function useForwardingData({
  userInfo,
  isUserInfoLoading,
}: UseForwardingDataProps): UseForwardingDataReturn {
  const [forwardingUser, setForwardingUser] = useState<ForwardingUser | null>(null);
  const [forwardingEnabled, setForwardingEnabled] = useState<boolean>(false);
  const [loadingForwardingData, setLoadingForwardingData] = useState<boolean>(true);
  const { showToast } = useToast();

  const isForwardingAllowedForPlan = useMemo(() => {
    if (!userInfo) return false;
    const planId = Number(userInfo.plan_id);
    return !!planId && env.FORWARDING_ALLOWED_PLAN_IDS.includes(planId);
  }, [userInfo]);

  const fetchInitialForwardingState = useCallback(async () => {
    if (!userInfo || !userInfo.email) {
      setForwardingUser(null);
      setForwardingEnabled(false);
      setLoadingForwardingData(false);
      return;
    }
    setLoadingForwardingData(true);
    try {
      // 临时禁用转发功能API调用，避免重复路径问题
      console.log('转发功能暂时禁用');
      setForwardingUser(null);
      setForwardingEnabled(false);
    } catch (error) {
      console.error('Failed to fetch initial forwarding state:', error);
      setForwardingUser(null);
      setForwardingEnabled(false);
    } finally {
      setLoadingForwardingData(false);
    }
  }, [userInfo]);

  useEffect(() => {
    // Only fetch if userInfo is loaded and available
    if (!isUserInfoLoading && userInfo) {
      // 添加防抖延迟，避免频繁调用
      const timer = setTimeout(() => {
        fetchInitialForwardingState();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [userInfo?.email, isUserInfoLoading]); // 只监听具体的userInfo.email字段变化

  const handleEnableForwarding = async () => {
    showToast('转发功能暂时禁用', 'warning');
    return;
  };

  const handleSyncForwardingUser = async () => {
    showToast('转发功能暂时禁用', 'warning');
    return;
  };

  return {
    forwardingUser,
    forwardingEnabled,
    isForwardingAllowedForPlan,
    handleEnableForwarding,
    handleSyncForwardingUser,
    loadingForwardingData,
  };
} 