'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { UserInfo } from '@/lib/types'; // UserInfo is needed from UserInfoResponse.data
import {
  getForwardUsers as getForwardUsersAction,
  createForwardUser as createForwardUserAction,
  updateForwardUser as updateForwardUserAction,
  fetchAdminShopPlans as fetchAdminShopPlansAction,
} from '@/lib/actions';
import { env } from '@/env.config';

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
      const forwardUsersRes = await getForwardUsersAction();
      if (forwardUsersRes.code === 0 && Array.isArray(forwardUsersRes.data)) {
        const now = Math.floor(Date.now() / 1000);
        const fwUser = forwardUsersRes.data.find((u: any) => u.username === userInfo.email);
        setForwardingUser(fwUser || null);
        setForwardingEnabled(!!fwUser && fwUser.expire > now);
      } else {
        setForwardingUser(null);
        setForwardingEnabled(false);
      }
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
      fetchInitialForwardingState();
    }
  }, [userInfo, isUserInfoLoading, fetchInitialForwardingState]);

  const handleEnableForwarding = async () => {
    if (!userInfo || !userInfo.email || !userInfo.plan_id) {
        alert('用户信息不完整，无法开启转发');
        return;
    }
    const email = userInfo.email;
    try {
      const usersRes = await getForwardUsersAction();
      if (usersRes.code !== 0 || !Array.isArray(usersRes.data)) {
        alert('获取转发用户失败'); return;
      }
      const existUser = usersRes.data.find((u: any) => u.username === email);
      if (existUser) {
        alert('已开启转发'); return;
      }
      const createRes = await createForwardUserAction(email);
      if (createRes.code !== 0) {
        alert(createRes.msg || '开启转发失败'); return;
      }
      const usersRes2 = await getForwardUsersAction();
      if (usersRes2.code !== 0 || !Array.isArray(usersRes2.data)) {
        alert('获取转发用户失败'); return;
      }
      const fwUser = usersRes2.data.find((u: any) => u.username === email);
      if (!fwUser) {
        alert('未找到刚创建的转发用户'); return;
      }
      const userPlanId = String(userInfo.plan_id);
      const forwardingPlanId = env.FORWARDING_PLAN_MAP?.[userPlanId];
      if (!forwardingPlanId) {
        alert(`未配置 plan_id=${userPlanId} 的转发套餐映射`); return;
      }
      const plansRes = await fetchAdminShopPlansAction();
      if (plansRes.code !== 0 || !Array.isArray(plansRes.data)) {
        alert('获取套餐信息失败'); return;
      }
      const plan = plansRes.data.find((p: any) => p.id == forwardingPlanId);
      if (!plan) {
        alert(`未找到 plan_id=${forwardingPlanId} 的套餐`); return;
      }
      fwUser.plan_id = plan.id;
      fwUser.group_id = plan.group_id;
      fwUser.max_rules = plan.max_rules;
      fwUser.speed_limit = plan.speed_limit;
      fwUser.ip_limit = plan.ip_limit;
      fwUser.connection_limit = plan.connection_limit;
      fwUser.traffic_enable = plan.traffic;
      if (userInfo.expired_at === null) {
        fwUser.expire = Date.parse('9999-12-31T00:00:00Z') / 1000;
      } else {
        fwUser.expire = userInfo.expired_at;
      }
      fwUser.update_traffic = true;
      fwUser.qd_update_traffic = true;
      fwUser.qd_update_group = true;
      fwUser.qd_update_max_rules = true;
      fwUser.qd_update_limits = true;
      await updateForwardUserAction(fwUser.id, fwUser);
      alert('开启转发成功');
      window.location.reload(); // This action causes a page reload
    } catch (e: any) {
      alert(e?.msg || e?.message || '开启转发失败');
    }
  };

  const handleSyncForwardingUser = async () => {
    if (!userInfo || !userInfo.email || !forwardingUser || !userInfo.plan_id) {
        alert('用户信息不完整或转发用户不存在，无法同步');
        return;
    }
    const email = userInfo.email;
    try {
      const usersRes = await getForwardUsersAction();
      if (usersRes.code !== 0 || !Array.isArray(usersRes.data)) {
        alert('获取转发用户失败'); return;
      }
      const fwUser = usersRes.data.find((u: any) => u.username === email);
      if (!fwUser) {
        alert('未找到转发用户进行同步'); return;
      }
      const userPlanId = String(userInfo.plan_id);
      const forwardingPlanId = env.FORWARDING_PLAN_MAP?.[userPlanId];
      if (!forwardingPlanId) {
        alert(`未配置 plan_id=${userPlanId} 的转发套餐映射`); return;
      }
      const plansRes = await fetchAdminShopPlansAction();
      if (plansRes.code !== 0 || !Array.isArray(plansRes.data)) {
        alert('获取套餐信息失败'); return;
      }
      const plan = plansRes.data.find((p: any) => p.id == forwardingPlanId);
      if (!plan) {
        alert(`未找到 plan_id=${forwardingPlanId} 的套餐`); return;
      }
      fwUser.plan_id = plan.id;
      fwUser.group_id = plan.group_id;
      fwUser.max_rules = plan.max_rules;
      fwUser.speed_limit = plan.speed_limit;
      fwUser.ip_limit = plan.ip_limit;
      fwUser.connection_limit = plan.connection_limit;
      fwUser.traffic_enable = plan.traffic;
      if (userInfo.expired_at === null) {
        fwUser.expire = Date.parse('9999-12-31T00:00:00Z') / 1000;
      } else {
        fwUser.expire = userInfo.expired_at;
      }
      fwUser.update_traffic = true;
      fwUser.qd_update_traffic = true;
      fwUser.qd_update_group = true;
      fwUser.qd_update_max_rules = true;
      fwUser.qd_update_limits = true;
      await updateForwardUserAction(fwUser.id, fwUser);
      alert('同步成功');
      // After successful sync, refresh the forwarding user state locally
      fetchInitialForwardingState(); // Re-fetch to update forwardingUser and forwardingEnabled
    } catch (e: any) {
      alert(e?.msg || e?.message || '同步失败');
    }
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