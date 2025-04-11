'use client';

import { handleLogout } from '@/lib/authUtils';

export default function SignOutButton() {
  // 简化登出处理函数，移除冗余的错误处理
  const handleSignOut = () => {
    handleLogout();
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
