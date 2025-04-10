'use client';

import { handleLogout } from '@/lib/authUtils';
import { useLanguage } from '@/lib/i18n/hooks';
import { useState, useEffect } from 'react';

export default function SignOutButton() {
  const { t } = useLanguage();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // 在组件加载时添加日志，确认组件正常渲染
  useEffect(() => {
    console.log('退出按钮组件已加载');
  }, []);
  
  // 同时添加按钮和div的点击处理
  const handleClick = () => {
    if (isLoggingOut) {
      console.log('已经在退出中，忽略点击');
      return;
    }
    
    console.log('退出按钮被点击 - 函数被调用');
    
    // 更新状态先，确保UI响应
    setIsLoggingOut(true);
    
    // 直接调用而不使用回调，简化流程
    try {
      console.log('正在调用handleLogout');
      window.localStorage.setItem('logout_attempt', Date.now().toString());
      
      // 直接执行强制刷新页面的操作，绕过可能存在的问题
      setTimeout(() => {
        console.log('强制重定向到登录页');
        window.location.href = '/login?forced=true&t=' + Date.now();
      }, 500);
      
    } catch (err) {
      console.error('登出点击处理出错:', err);
    }
  };

  return (
    <>
      {/* 添加一个直接的按钮元素，确保有一个简单的点击目标 */}
      <button
        type="button"
        onClick={handleClick}
        className="block w-full px-4 py-3 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700 disabled:opacity-50 transition-colors duration-150"
        style={{ touchAction: 'manipulation', WebkitAppearance: 'none' }}
        disabled={isLoggingOut}
      >
        {isLoggingOut ? '正在退出...' : (t?.common?.signOut || 'Sign out')}
      </button>
      
      {/* 添加开发模式下的调试按钮 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-1 text-xs text-red-500 text-center">
          <button 
            onClick={() => window.location.href='/login'} 
            className="underline"
          >
            快速跳转
          </button>
        </div>
      )}
    </>
  );
}
