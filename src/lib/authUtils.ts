'use client'

export const clearAuthData = async () => {
  if (typeof window === 'undefined') return;

  // 清理 sessionStorage
  sessionStorage.clear();

  // 调用服务端接口清除 HttpOnly cookie
  try {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include', // 确保发送cookies
    });
    
    if (!response.ok) {
      console.error('服务端登出失败:', response.statusText);
    }
  } catch (error) {
    console.error('调用登出接口出错:', error);
  }
};

export const handleLogout = (redirect = true, callback?: () => void) => {
  // 添加超时保护，确保即使清理操作卡住也能继续
  const timeoutId = setTimeout(() => {
    console.log('登出操作超时，强制跳转');
    if (redirect && typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    if (callback) callback();
  }, 5000);

  clearAuthData()
    .then(() => {
      clearTimeout(timeoutId);
      if (redirect && typeof window !== 'undefined') {
        console.log('清除完成，正在跳转...');
        
        // 使用更可靠的方式跳转，避免浏览器缓存问题
        try {
          // 在移动设备上更可靠的跳转方法
          window.location.replace('/login?t=' + new Date().getTime());
        } catch (e) {
          console.error('跳转失败，使用备用方法', e);
          window.location.href = '/login';
        }
      }
      if (callback) callback();
    })
    .catch(error => {
      clearTimeout(timeoutId);
      console.error('登出过程中发生错误:', error);
      if (callback) callback();
    });
};

// 认证数据现在统一通过HttpOnly Cookie管理
// 不再使用localStorage存储敏感的认证信息

// 检查登录状态（包括cookie）
export const checkAuthDataFromServer = async (): Promise<{ isLoggedIn: boolean; authData: string | null }> => {
  try {
    const response = await fetch('/api/auth/status', {
      method: 'GET',
      credentials: 'include',
    });
    
    if (response.ok) {
      const data = await response.json();
      return {
        isLoggedIn: data.isLoggedIn,
        authData: data.authData
      };
    }
  } catch (error) {
    console.error('检查服务端登录状态失败:', error);
  }
  
  return { isLoggedIn: false, authData: null };
};
