import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { UserInfoResponse } from '@/lib/types';

interface UsePageSetupProps {
  userInfo: UserInfoResponse | null;
  loadingUserInfo: boolean;
}

export function usePageSetup({ userInfo, loadingUserInfo }: UsePageSetupProps) {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Ensure window is defined (runs only on client-side)
    if (typeof window !== 'undefined') {
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 768);
      };
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }
  }, []);

  useEffect(() => {
    if (!loadingUserInfo && (!userInfo || userInfo.status !== 'success')) {
      router.push('/login');
    }
  }, [userInfo, loadingUserInfo, router]);

  return { isMobile };
} 