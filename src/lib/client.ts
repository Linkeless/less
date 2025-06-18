// Import BASE_URL from environment configuration
import { env } from '@/env.config';

const BASE_URL = env.NEXT_PUBLIC_API_URL;

const handleResponse = async (response: Response) => {
  const data = await response.json();
  
  if (response.status === 401) {
    localStorage.removeItem('auth_data');
    window.location.href = '/login';
    throw new Error(data.message || 'Unauthorized');
  }

  if (data.status === 'fail' || !response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
};

// 确保函数名与功能一致，避免与服务端函数混淆
export const clientFetch = async (path: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('auth_data');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: token }),
    ...options.headers,
  };

  const response = await fetch(path, {
    ...options,
    headers,
  });

  return handleResponse(response);
};

export default {
  get: (path: string) => clientFetch(`${BASE_URL}${path}`),
  post: (path: string, data?: any) => clientFetch(`${BASE_URL}${path}`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};