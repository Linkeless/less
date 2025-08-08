'use client';

import { useState, useEffect, useCallback } from 'react';
// 通知功能已移除 - 接口不可用

// Define a more specific type for Notice if available from your API response
interface Notice {
  id: string | number;
  content: string;
  title?: string;
  tags?: string[]; 
  // other properties...
}

export interface UseNoticeDataReturn {
  notices: Notice[];
  loadingNotices: boolean;
  showNotices: boolean;
  setShowNotices: React.Dispatch<React.SetStateAction<boolean>>;
  popupNotice: Notice | null;
  showPopupNotice: boolean;
  setShowPopupNotice: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useNoticeData(): UseNoticeDataReturn {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loadingNotices, setLoadingNotices] = useState<boolean>(true);
  const [showNotices, setShowNotices] = useState<boolean>(false);
  
  const [popupNotice, setPopupNotice] = useState<Notice | null>(null);
  const [showPopupNotice, setShowPopupNotice] = useState<boolean>(false);

  const fetchNotices = useCallback(async () => {
    setLoadingNotices(true);
    // 通知功能已移除 - 直接返回空数据，不调用API
    try {
      setNotices([]);
      setPopupNotice(null);
      setShowPopupNotice(false);
    } catch (error) {
      console.error('Notice functionality has been disabled:', error);
      setNotices([]);
      setPopupNotice(null);
    } finally {
      setLoadingNotices(false);
    }
  }, []);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  return {
    notices,
    loadingNotices,
    showNotices,
    setShowNotices,
    popupNotice,
    showPopupNotice,
    setShowPopupNotice,
  };
} 