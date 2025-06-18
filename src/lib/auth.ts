'use server'

import { cookies } from 'next/headers';
import { env } from '@/env.config';

interface LoginResponse {
  status: string;
  message: string;
  data?: {
    auth_data: string;
  };
  error?: string;
}

export async function login(email: string, password: string, rememberMe: boolean): Promise<LoginResponse> {
  const response = await fetch(`${env.API_URL}/api/v1/passport/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();

  if (data.data?.auth_data) {
    const cookieStore = await cookies();
    
    if (rememberMe) {
      // 勾选"记住我"：设置30天过期时间
      cookieStore.set({
        name: 'auth_data',
        value: data.data.auth_data,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30天
      });
    } else {
      // 不勾选"记住我"：会话级别Cookie（浏览器关闭后失效）
      cookieStore.set({
        name: 'auth_data',
        value: data.data.auth_data,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
        // 不设置expires，为会话级别Cookie
      });
    }
  }

  return data;
}

// 认证状态检查现在通过 /api/auth/status 接口处理
