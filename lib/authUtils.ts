'use client'

export const clearAuthData = async () => {
  if (typeof window === 'undefined') return;

  // 清理 localStorage 和 sessionStorage
  localStorage.clear();
  sessionStorage.clear();

  // 尝试通过服务端接口清除 HttpOnly cookie
  try {
    // 调用登出接口清除服务端设置的 HttpOnly cookie
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

  // 仍然尝试在客户端清除非HttpOnly cookies
  const cookies = document.cookie.split(';');
  const domain = window.location.hostname;
  
  console.log('正在清除客户端可访问的cookies...');
  
  cookies.forEach(cookie => {
    const cookieName = cookie.split('=')[0].trim();
    if (cookieName) {
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=${domain}; path=/`;
      
      // 处理主域名
      if (domain.indexOf('.') > 0) {
        const mainDomain = domain.substring(domain.indexOf('.'));
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=${mainDomain}; path=/`;
      }
    }
  });
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

export const setAuthData = (authData: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_data', authData);
  }
};

export const getAuthData = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_data');
};
