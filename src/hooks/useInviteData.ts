'use client';

import { useState, useEffect, useCallback } from 'react';
import { getInviteInfo, createInviteCode, getInviteCommissionRecords, getUserInfo } from '@/lib/client';
import md5 from 'md5';

export function useInviteData() {
  const [codes, setCodes] = useState<{ code: string }[]>([]);
  const [stat, setStat] = useState<number[]>([]);
  const [user, setUser] = useState<{ name: string; email: string; imageUrl: string }>({ name: '', email: '', imageUrl: '' });
  const [commissionRecords, setCommissionRecords] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setLoadingRecords(true);
    setError('');
    try {
      const [inviteRes, userRes, recordsRes] = await Promise.all([
        getInviteInfo(),
        getUserInfo(),
        getInviteCommissionRecords(),
      ]);

      setCodes(inviteRes.data.codes || []);
      setStat(inviteRes.data.stat || []);
      setCommissionRecords(recordsRes.data || []);
      
      if (userRes.code === 0 && userRes.data) {
        const email = userRes.data.email;
        const name = email.split('@')[0];
        const imageUrl = userRes.data.avatar_url || `https://www.gravatar.com/avatar/${md5(email.trim().toLowerCase())}?s=256&d=monsterid`;
        setUser({ name, email, imageUrl });
      }
    } catch (err: any) {
      setError(err.message || '加载数据失败');
    } finally {
      setLoading(false);
      setLoadingRecords(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateInvite = async () => {
    setCreating(true);
    setError('');
    try {
      await createInviteCode();
      // Re-fetch invite info to update codes and stats
      const inviteRes = await getInviteInfo();
      setCodes(inviteRes.data.codes || []);
      setStat(inviteRes.data.stat || []);
    } catch (err: any) {
      setError(err.message || '生成邀请码失败');
    } finally {
      setCreating(false);
    }
  };

  return {
    codes,
    stat,
    user,
    commissionRecords,
    loading,
    loadingRecords,
    creating,
    error,
    handleCreateInvite,
    refetchData: fetchData, // Expose refetch if needed elsewhere, or for pull-to-refresh
  };
}
