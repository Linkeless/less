'use client';

import { handleLogout } from '@/lib/authUtils';

export default function SignOutButton() {
  const handleSignOut = async () => {
    try {
      // 这里可以添加退出前的确认
      handleLogout();
    } catch (error) {
      console.error('登出失败:', error);
      // 即使请求失败也清理本地状态并跳转
      handleLogout();
    }
  };

  return (
    <button
      onClick={handleSignOut}
      className="block w-full px-4 py-2 text-sm text-left text-gray-700"
    >
      Sign out
    </button>
  );
}
