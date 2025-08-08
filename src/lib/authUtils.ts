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

export const handleLogout = (redirect = false, callback?: () => void) => {
  // 破坏性修改：移除所有自动跳转逻辑
  clearAuthData()
    .then(() => {
      console.log('清除认证数据完成');
      // 不再自动跳转，由调用方决定是否跳转
      if (callback) callback();
    })
    .catch(error => {
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
