'use client';

import { useState, useEffect, useCallback } from 'react';
import { getUserInfo } from '@/lib/client';
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
      const userRes = await getUserInfo();
      // 暂无用户侧邀请接口：置空
      setCodes([]);
      setStat([]);
      setCommissionRecords([]);
      
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
      // 无用户侧创建接口
      throw new Error('邀请接口未在 swagger.json 提供，功能暂不可用');
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
