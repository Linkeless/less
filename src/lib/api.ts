const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const handleResponse = async (response: Response) => {
  const data = await response.json();
  
  if (response.status === 401) {
    localStorage.removeItem('auth_data');
    // 不再自动跳转，让调用方处理401错误
    throw new Error(data.message || 'Unauthorized');
  }

  if (data.status === 'fail' || !response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
};

const createRequest = async (path: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('auth_data');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: token }),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  return handleResponse(response);
};

// 移除所有重复的类型定义，改为从types.ts导入
import {
  UserInfo,
  UserInfoResponse,
  UserSubscriptionResponse,
  TrafficLog,
  TrafficLogResponse,
  KnowledgeResponse,
  PurchasePlan,
  APIResponse,
  OrderResponse,
  CheckoutResponse,
  CouponResponse
} from './types';

// 仅保留客户端特有的类型
export interface ProcessedTrafficData {
  date: string;
  download: number;
  upload: number;
}

// 保留处理函数，因为这是客户端特有的逻辑
export const processTrafficData = (data: TrafficLog[]): ProcessedTrafficData[] => {
  const dailyData = new Map<number, { download: number; upload: number }>();
  
  data.forEach(item => {
    const day = item.record_at || item.created_at;
    const current = dailyData.get(day) || { download: 0, upload: 0 };
    
    const rate = item.server_rate || 1;
    dailyData.set(day, {
      download: current.download + (item.d * rate) / (1024 * 1024 * 1024),
      upload: current.upload + (item.u * rate) / (1024 * 1024 * 1024)
    });
  });

  return Array.from(dailyData.entries())
    .map(([timestamp, traffic]) => ({
      date: new Date(timestamp * 1000).toLocaleDateString(),
      download: Number(traffic.download.toFixed(2)),
      upload: Number(traffic.upload.toFixed(2))
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

export const formatBytes = (bytes: number): string => {
  const units = ['MB', 'GB', 'TB', 'PB'];
  let value = bytes / (1024 * 1024 * 1024); // Convert to GB first
  let unitIndex = 1; // Start at GB (index 1)

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  if (unitIndex === 0) { // MB
    return `${Math.round(value)}${units[unitIndex]}`;
  }
  return `${value.toFixed(1)}${units[unitIndex]}`;
};

export default {
  get: (path: string) => createRequest(path),
  post: (path: string, data?: any) => createRequest(path, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};
