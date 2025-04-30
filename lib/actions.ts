'use server'

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { serverFetch } from './server';
import { env } from '@/env.config';
import type { 
  UserInfoResponse, 
  SubscriptionResponse,
  TrafficLogResponse,
  KnowledgeResponse,
  TicketResponse,
  ResetUUIDResponse,
  PlanResponse,
  OrderResponse,
  OrderDetailResponse,
  PaymentMethodResponse,
  OrdersResponse,
  CheckoutResponse,
  CouponResponse,
  ForwardUser,
  ShopPlan,
  AdminShopPlansResponse
} from './types';

export async function getUserInfo(): Promise<UserInfoResponse> {
  return serverFetch('/api/v1/user/info');
}

export async function getSubscription(): Promise<SubscriptionResponse> {
  return serverFetch('/api/v1/user/getSubscribe');
}

export async function getTrafficLog(): Promise<TrafficLogResponse> {
  return serverFetch('/api/v1/user/stat/getTrafficLog');
}

export async function resetUUID(): Promise<ResetUUIDResponse> {
  return serverFetch('/api/v1/user/uuid/reset', {
    method: 'POST',
  });
}

export async function fetchKnowledge(): Promise<KnowledgeResponse> {
  return serverFetch('/api/v1/user/knowledge/fetch?language=zh-CN');
}

export async function fetchPlans(): Promise<PlanResponse> {
  return serverFetch('/api/v1/user/plan/fetch');
}

export async function fetchTickets(): Promise<TicketResponse> {
  return serverFetch('/api/v1/user/ticket/fetch');
}

export async function createOrder(params: {
  period: string;
  plan_id: number;
  coupon_code?: string;
}): Promise<OrderResponse> {
  const searchParams = new URLSearchParams();
  searchParams.append('period', params.period);
  searchParams.append('plan_id', params.plan_id.toString());
  if (params.coupon_code) {
    searchParams.append('coupon_code', params.coupon_code);
  }
  
  return serverFetch(`/api/v1/user/order/save?${searchParams}`, {
    method: 'POST'
  });
}

export async function getOrderDetail(trade_no: string): Promise<OrderDetailResponse> {
  return serverFetch(`/api/v1/user/order/detail?trade_no=${trade_no}`);
}

export async function getPaymentMethods(): Promise<PaymentMethodResponse> {
  return serverFetch('/api/v1/user/order/getPaymentMethod');
}

export async function fetchOrders(): Promise<OrdersResponse> {
  return serverFetch('/api/v1/user/order/fetch');
}

export async function cancelOrder(trade_no: string): Promise<{ status: string; message: string }> {
  const result = await serverFetch(`/api/v1/user/order/cancel?trade_no=${trade_no}`, {
    method: 'POST'
  });
  revalidatePath('/orders');
  return result;
}

export async function checkout(trade_no: string, method: number): Promise<CheckoutResponse> {
  return serverFetch(`/api/v1/user/order/checkout?trade_no=${trade_no}&method=${method}`, {
    method: 'POST'
  });
}

export async function checkCoupon(code: string, plan_id: number): Promise<CouponResponse> {
  return serverFetch('/api/v1/user/coupon/check', {
    method: 'POST',
    body: JSON.stringify({ code, plan_id }),
  });
}

export async function register(formData: {
  email: string;
  password: string;
  email_code: string;
  invite_code?: string;
}) {
  return serverFetch('/api/v1/passport/auth/register', {
    method: 'POST',
    body: JSON.stringify(formData),
  });
}

export async function sendVerificationEmail(email: string) {
  return serverFetch('/api/v1/passport/comm/sendEmailVerify', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

// Add new utility for client-side navigation
export async function handleAuthError(error: Error) {
  if (error.message === 'Unauthorized') {
    (await cookies()).delete('auth_data');
    return '/login';
  }
  return null;
}

export async function processOrder(data: any) {
  return serverFetch('/api/v1/user/order/save', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getProducts() {
  return serverFetch('/api/v1/user/plan/fetch');
}

export async function getProductById(id: string) {
  const response = await serverFetch(`/api/v1/user/plan/fetch?id=${id}`);
  if (Array.isArray(response.data)) {
    return {
      ...response,
      data: response.data[0]
    };
  }
  return response;
}

export async function verifyPayment(trade_no: string, method: number) {
  return serverFetch(`/api/v1/user/order/checkout?trade_no=${trade_no}&method=${method}`, {
    method: 'POST'
  });
}

export async function checkUserSubscription() {
  try {
    const response = await serverFetch('/api/v1/user/getSubscribe');
    return response.data?.plan_id ?? null;
  } catch (error) {
    return null;
  }
}

export async function getInviteInfo() {
  return serverFetch('/api/v1/user/invite/fetch');
}

export async function createInviteCode() {
  return serverFetch('/api/v1/user/invite/save', { method: 'GET' });
}

export async function getInviteCommissionRecords() {
  return serverFetch('/api/v1/user/invite/details?page_size=999');
}

export async function getUserNotices() {
  return serverFetch('/api/v1/user/notice/fetch');
}

interface ForwardingLoginResponse {
  code: number;
  data: string;
  msg: string;
}

interface ForwardingRule {
  id: number;
  name: string;
  uid: number;
  listen_port: number;
  device_group_in: number;
  device_group_out: number;
  traffic_used: number;
  config: string;
  status: string;
  display_updated_at: string;
}

interface ForwardingRulesResponse {
  code: number;
  data: ForwardingRule[];
  count: number;
}

interface DeviceGroup {
  id: number;
  name: string;
  type: string;
  ratio: string;
  traffic_used: number;
  connect_host?: string;
  port_range?: string;
  config: string;
  show_order?: number;
  display_num?: number;
}

interface DeviceGroupsResponse {
  code: number;
  data: DeviceGroup[];
  msg: string;
}

export async function getForwardingRules(userId: number, page: number = 1, size: number = 10): Promise<ForwardingRulesResponse> {
  const headers: Record<string, string> = {};
  if (env.FORWARDING_ADMIN_TOKEN) {
    headers['Authorization'] = env.FORWARDING_ADMIN_TOKEN;
  }
  const response = await serverFetch(`/api/v1/admin/user/${userId}/forward?page=${page}&size=${size}`, {
    method: 'GET',    
    headers,
    baseUrl: env.FORWARDING_API_URL
  });
  return response;
}

export async function getDeviceGroups(userId: number): Promise<DeviceGroupsResponse> {
  const headers: Record<string, string> = {};
  if (env.FORWARDING_ADMIN_TOKEN) {
    headers['Authorization'] = env.FORWARDING_ADMIN_TOKEN;
  }
  return serverFetch(`/api/v1/admin/devicegroup?uid=${userId}`, {
    headers,
    baseUrl: env.FORWARDING_API_URL
  });
}

interface CreateForwardingRuleResponse {
  code: number;
  msg: string;
}

export async function createForwardingRule(
  userId: number,
  data: {
    name: string;
    device_group_in: number;
    device_group_out: number | null;
    config: string;
    listen_port: number;
  }
): Promise<{ code: number; msg: string }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (env.FORWARDING_ADMIN_TOKEN) {
    headers['Authorization'] = env.FORWARDING_ADMIN_TOKEN;
  }
  return serverFetch(`/api/v1/admin/user/${userId}/forward`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(data),
    baseUrl: env.FORWARDING_API_URL,
  });
}

export async function updateForwardingRule(
  userId: number,
  ruleId: number,
  data: {
    name: string;
    device_group_in: number;
    device_group_out: number | null;
    config: string;
    listen_port: number;
  }
): Promise<{ code: number; msg: string }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (env.FORWARDING_ADMIN_TOKEN) {
    headers['Authorization'] = env.FORWARDING_ADMIN_TOKEN;
  }
  return serverFetch(`/api/v1/admin/user/${userId}/forward/${ruleId}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
    baseUrl: env.FORWARDING_API_URL,
  });
}

export async function diagnoseForwardingRule(userId: number, ruleId: number) {
  const headers: Record<string, string> = {};
  if (env.FORWARDING_ADMIN_TOKEN) {
    headers['Authorization'] = env.FORWARDING_ADMIN_TOKEN;
  }
  return serverFetch(`/api/v1/admin/user/${userId}/forward/${ruleId}/diagnose`, {
    method: 'POST',
    headers,
    baseUrl: env.FORWARDING_API_URL
  });
}

export async function deleteForwardingRules(userId: number, ids: number[]): Promise<{ code: number; msg: string }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (env.FORWARDING_ADMIN_TOKEN) {
    headers['Authorization'] = env.FORWARDING_ADMIN_TOKEN;
  }
  return serverFetch(`/api/v1/admin/user/${userId}/forward`, {
    method: 'DELETE',
    headers,
    body: JSON.stringify({ ids }),
    baseUrl: env.FORWARDING_API_URL,
  });
}

export async function createForwardUser(username: string): Promise<{ code: number; msg: string }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (env.FORWARDING_ADMIN_TOKEN) {
    headers['Authorization'] = env.FORWARDING_ADMIN_TOKEN;
  }
  return serverFetch('/api/v1/admin/user', {
    method: 'PUT',
    headers,
    body: JSON.stringify({ username }),
    baseUrl: env.FORWARDING_API_URL,    
  });
}

export async function getForwardUsers(page: number = 1, size: number = 1000): Promise<{ code: number; data: any[]; msg?: string }> {
  const headers: Record<string, string> = {};
  if (env.FORWARDING_ADMIN_TOKEN) {
    headers['Authorization'] = env.FORWARDING_ADMIN_TOKEN;
  }
  return serverFetch(`/api/v1/admin/user?page=${page}&size=${size}`, {
    method: 'GET',
    headers,
    baseUrl: env.FORWARDING_API_URL,
  });
}

export async function updateForwardUser(id: number, user: ForwardUser): Promise<{ code: number; msg: string }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json; charset=utf-8',
  };
  if (env.FORWARDING_ADMIN_TOKEN) {
    headers['Authorization'] = env.FORWARDING_ADMIN_TOKEN;
  }
  return serverFetch(`/api/v1/admin/user/${id}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(user),
    baseUrl: env.FORWARDING_API_URL,
  });
}

export async function fetchAdminShopPlans(): Promise<AdminShopPlansResponse> {
  const headers: Record<string, string> = {};
  if (env.FORWARDING_ADMIN_TOKEN) {
    headers['Authorization'] = env.FORWARDING_ADMIN_TOKEN;
  }
  return serverFetch('/api/v1/admin/shop/plan', {
    method: 'GET',
    headers,
    baseUrl: env.FORWARDING_API_URL,
  });
}
