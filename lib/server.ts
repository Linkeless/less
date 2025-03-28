import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const API_URL = process.env.API_URL;

if (!API_URL) {
  throw new Error('API_URL environment variable is not defined');
}

export class APIError extends Error {
  constructor(
    public status: number,
    public message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export async function serverFetch<T = any>(path: string, init?: RequestInit): Promise<T> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_data');

  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: token.value }),
        ...init?.headers,
      },
      cache: 'no-store'
    });

    const data = await response.json();

    if (response.status === 401) {
      (await cookies()).delete('auth_data');
      redirect('/login');
    }
    // 特殊处理优惠券校验接口
    if (path === '/api/v1/user/coupon/check' && data && data.status === 'fail') {
      console.log('检测到优惠券无效，直接返回消息而不抛出错误');
      console.log('优惠券无效响应数据:', {
        message: data.message,
        status: data.status,
        fullResponse: data
      });
      return { message: data.message, valid: false } as unknown as T;
    }
    if (!response.ok || data.status === 'fail') {
      throw new APIError(
        response.status,
        data.message || `Request failed with status ${response.status}`,
        data.error
      );
    }

    return data as T;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(500, 'Internal server error', 'INTERNAL_ERROR');
  }
}
