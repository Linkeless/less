'use client';

import { useState, useEffect, useCallback } from 'react';
import { getUserNotices as fetchUserNoticesAction } from '@/lib/actions'; // Renamed for clarity

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
    try {
      const noticesData = await fetchUserNoticesAction();
      const fetchedNotices = noticesData.data || [];
      setNotices(fetchedNotices as Notice[]); // Ensure type assertion

      // Check for popup notice among the fetched notices
      if (Array.isArray(fetchedNotices)) {
        const popup = fetchedNotices.find((n: Notice) => 
          Array.isArray(n.tags) && n.tags.includes('弹窗')
        );
        if (popup) {
          setPopupNotice(popup as Notice); // Ensure type assertion
          setShowPopupNotice(true);
        } else {
          setPopupNotice(null);
          // setShowPopupNotice(false); // Optionally hide if no new popup notice
        }
      }
    } catch (error) {
      console.error('Failed to fetch notices:', error);
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