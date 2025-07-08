'use client';

import { useState, useEffect, useCallback } from 'react';
import type { UserInfoResponse, TrafficLog, Subscription } from '@/lib/types';
import {
  getUserInfo,
  getSubscription,
  getTrafficLog,
  resetUUID as resetUUIDAction,
} from '@/lib/actions';

export interface UseUserDataReturn {
  userInfo: UserInfoResponse | null;
  loadingUserInfo: boolean;
  subscription: Subscription | null;
  loadingSubscription: boolean;
  trafficLog: TrafficLog[];
  loadingTrafficLog: boolean;
  handleResetUUID: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
}

export function useUserData(): UseUserDataReturn {
  const [userInfo, setUserInfo] = useState<UserInfoResponse | null>(null);
  const [loadingUserInfo, setLoadingUserInfo] = useState(true);

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);

  const [trafficLog, setTrafficLog] = useState<TrafficLog[]>([]);
  const [loadingTrafficLog, setLoadingTrafficLog] = useState(true);

  const fetchInitialData = useCallback(async () => {
    setLoadingUserInfo(true);
    setLoadingSubscription(true);
    setLoadingTrafficLog(true);
    try {
      const [userInfoData, subscriptionData, trafficData] = await Promise.all([
        getUserInfo(),
        getSubscription(),
        getTrafficLog(),
      ]);

      if (userInfoData.status === 'success' && userInfoData.data) {
        setUserInfo(userInfoData as UserInfoResponse); // Ensure type assertion if needed
      } else {
        setUserInfo(null); // Or handle error appropriately
      }

      // Assuming SubscriptionResponse is the correct type from getSubscription()
      setSubscription(subscriptionData as unknown as Subscription);

      setTrafficLog(trafficData.data || []);

    } catch (error) {
      console.error('Failed to fetch initial user/subscription/traffic data:', error);
      // Potentially set error states here
      setUserInfo(null);
      setSubscription(null);
      setTrafficLog([]);
    } finally {
      setLoadingUserInfo(false);
      setLoadingSubscription(false);
      setLoadingTrafficLog(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleResetUUID = async () => {
    if (!userInfo) return; // Or handle this case more gracefully
    try {
      const response = await resetUUIDAction(); // Call the imported action
      // Update only the UUID part of the userInfo, preserving other data
      setUserInfo((prev) => {
        if (prev && prev.data) {
          return {
            ...prev,
            data: {
              ...prev.data,
              uuid: response.data.uuid,
            },
          };
        }
        return prev; // Should not happen if userInfo is checked
      });
      // Optionally, re-fetch subscription if UUID change affects it, though unlikely for most systems.
    } catch (error) {
      console.error('Failed to reset UUID:', error);
      // Potentially set an error message to display to the user
    }
  };

  const refreshSubscription = useCallback(async () => {
    try {
      const subscriptionData = await getSubscription();
      setSubscription(subscriptionData as unknown as Subscription);
    } catch (error) {
      console.error('Failed to refresh subscription data:', error);
    }
  }, []);

  return {
    userInfo,
    loadingUserInfo,
    subscription,
    loadingSubscription,
    trafficLog,
    loadingTrafficLog,
    handleResetUUID,
    refreshSubscription,
  };
} 