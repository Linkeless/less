'use client';

import { handleLogout } from '@/lib/authUtils';
import { useLanguage } from '@/lib/i18n/hooks';
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

export default function SignOutButton() {
  const { language } = useLanguage();
  const signOutText = language === 'zh-CN' ? '退出登录' : 'Sign out';

  const handleSignOut = () => {
    handleLogout();
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
