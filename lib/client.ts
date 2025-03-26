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
  get: (path: string) => clientFetch(path),
  post: (path: string, data?: any) => clientFetch(path, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};