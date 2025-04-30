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

export async function serverFetch<T = any>(path: string, init?: RequestInit & { baseUrl?: string }): Promise<T> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_data');
  const baseUrl = init?.baseUrl || API_URL;

  try {
    const response = await fetch(`${baseUrl}${path}`, {
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
      return { message: data.message, valid: false } as unknown as T;
    }
    
    // 特殊处理订单创建接口，如果是未付款订单错误，返回适合的格式便于前端处理
    if (path.startsWith('/api/v1/user/order/save') && data && data.status === 'fail' && 
        (data.message?.includes('未付款') || data.message?.includes('开通中的订单'))) {
      return { 
        status: 'fail', 
        message: data.message,
        data: null,
        error: 'EXISTING_UNPAID_ORDER' 
      } as unknown as T;
    }
    
    // 特殊处理端口转发接口错误，直接返回数据给前端
    // if (path === '/api/v1/user/forward' && data && typeof data.code !== 'undefined' && data.code !== 0) {
    //   return data as T;
    // }
    
    // 特殊处理 /api/v1/admin/user
    if (path.startsWith('/api/v1/admin/') && data && typeof data.code !== 'undefined' && data.code !== 0) {
      return data as T;
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
