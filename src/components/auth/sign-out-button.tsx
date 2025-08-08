'use client';

import { logout } from '@/lib/client';
import { useLanguage } from '@/lib/i18n/hooks';
import { useRouter } from 'next/navigation';
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

export default function SignOutButton() {
  const { language } = useLanguage();
  const router = useRouter();
  const signOutText = language === 'zh-CN' ? '退出登录' : 'Sign out';

  const handleSignOut = async () => {
    try {
      await logout();
      // 显式处理跳转
      router.push('/login');
    } catch (error) {
      console.error('退出登录失败:', error);
    }
  };

  return (
    <button
      onClick={handleSignOut}
      className="flex w-full items-center gap-2 rounded-md px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
    >
      <ArrowRightOnRectangleIcon className="size-4" />
      <span>{signOutText}</span>
    </button>
  );
}
