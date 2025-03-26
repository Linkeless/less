'use client'

export const clearAuthData = () => {
  if (typeof window === 'undefined') return;

  // 清理 localStorage
  localStorage.clear();
  sessionStorage.clear();

  // 清理所有 cookies
  const cookies = document.cookie.split(';');
  const domain = window.location.hostname;
  
  cookies.forEach(cookie => {
    const cookieName = cookie.split('=')[0].trim();
    // 同时处理根路径和当前路径
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=${domain}; path=/`;
  });
};

export const handleLogout = (redirect = true) => {
  clearAuthData();
  if (redirect && typeof window !== 'undefined') {
    window.location.href = '/login';
  }
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
