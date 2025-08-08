// Import BASE_URL from environment configuration and secure auth manager
import { env } from '@/env.config';
import { secureRequest, login as secureLogin, register as secureRegister, logout as secureLogout, checkAuthStatus as secureCheckAuthStatus } from '@/lib/auth-client';

const BASE_URL = env.NEXT_PUBLIC_API_URL;

// 安全的客户端fetch函数 - 使用HttpOnly cookies和自动token刷新
export const clientFetch = async (path: string, options: RequestInit = {}) => {
  const response = await secureRequest(path, options);
  
  // 检查响应是否成功
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed with status ${response.status}`);
  }
  
  // 返回JSON数据
  return response.json();
};

// 客户端API方法
export const checkCoupon = async (code: string, plan_id: number) => {
  return clientFetch(`${BASE_URL}/api/v1/user/coupon/check`, {
    method: 'POST',
    body: JSON.stringify({ code, plan_id }),
  });
};

// 获取用户的订阅信息 - 根据swagger.json使用正确的/subscriptions/my接口
export const getSubscription = async (status?: string, limit: number = 10, offset: number = 0) => {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString()
  });
  if (status) {
    params.append('status', status);
  }
  return clientFetch(`${BASE_URL}/subscriptions/my?${params}`);
};

export const getSubscriptionPlans = async (): Promise<{
  code: number;
  message: string;
  data: Array<{
    id: number;
    name: string;
    code: string;
    description: string;
    price: number;
    currency: string;
    billing_cycle: string;
    billing_interval: number;
    trial_period_days: number;
    status: string;
    is_visible: boolean;
    sort_order: number;
    is_popular: boolean;
    is_recommended: boolean;
    setup_fee: number;
    cancellation_fee: number;
    traffic_limit: number;
    traffic_limit_gb: number;
    traffic_limit_text: string;
    traffic_reset_cycle: string;
    created_at: string;
    updated_at: string;
  }>;
  total: number;
  limit: number;
  offset: number;
}> => {
  return clientFetch(`${BASE_URL}/subscription/plans`);
};

export const createOrder = async (params: {
  subscription_plan_id: number;
  order_type?: 'new' | 'renewal' | 'upgrade' | 'downgrade';
  payment_gateway?: string;
  payment_method?: string;
  coupon_code?: string;
  user_id?: number;
  return_url?: string;
}) => {
  return clientFetch(`${BASE_URL}/subscription/orders`, {
    method: 'POST',
    body: JSON.stringify({
      subscription_plan_id: params.subscription_plan_id,
      order_type: params.order_type || 'new',
      payment_gateway: params.payment_gateway || 'epay',
      payment_method: params.payment_method || 'alipay',
      coupon_code: params.coupon_code,
      user_id: params.user_id || 1, // 临时设置，实际应由后端从token获取
      return_url: params.return_url,
    }),
  });
};

// 获取订单详情（沿用旧形态以兼容支付页，后续支付流程再整体切换到新接口）
export const getOrderDetail = async (order_id: string | number) => {
  return clientFetch(`${BASE_URL}/subscription/orders/${order_id}`);
};

export const getPaymentMethods = async () => {
  // 使用公开的支付方法API端点
  return clientFetch(`${BASE_URL}/payment/methods`);
};

// 获取用户信息 - 使用swagger.json中定义的正确端点
export const getUserInfo = async () => {
  return clientFetch(`${BASE_URL}/user/profile`);
};

export const checkout = async (payment_no: string, method: number) => {
  // 使用支付订单API进行结账
  return clientFetch(`${BASE_URL}/payment/orders`, {
    method: 'POST',
    body: JSON.stringify({
      payment_no,
      payment_method: method,
    }),
  });
};

// 快速购买订阅（一步完成订单创建和支付）
export const quickPurchaseSubscription = async (params: {
  plan_id: number;
  payment_method: string;
  payment_gateway?: string;
  return_url?: string;
  coupon_code?: string;
}) => {
  return clientFetch(`${BASE_URL}/subscription/quick-purchase`, {
    method: 'POST',
    body: JSON.stringify({
      plan_id: params.plan_id,
      payment_method: params.payment_method,
      payment_gateway: params.payment_gateway || 'epay',
      return_url: params.return_url,
      coupon_code: params.coupon_code,
    }),
  });
};

// 获取用户活跃订阅信息
export const getActiveSubscriptions = async () => {
  return clientFetch(`${BASE_URL}/subscriptions/my/active`);
};

// 用户订单列表（新接口）：GET /orders
export const fetchOrders = async (limit: number = 100, offset: number = 0) => {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  return clientFetch(`${BASE_URL}/orders?${params.toString()}`);
};

// 取消订单用户端未提供公开接口（以 swagger.json 为准），移除旧实现

// 流量日志功能已移除 - 接口不可用

// 添加重置UUID客户端API  
// ⚠️ 警告：此端点未在swagger.json中定义，可能已废弃或路径已变更
// TODO: 需要后端确认正确端点，swagger.json中存在 /admin/subscriptions/users/{id}/reset-traffic
// 但这是管理员端点，用户端点可能需要其他实现
export const resetUUID = async () => {
  // 临时保留现有端点，但需要后端确认
  return clientFetch(`${BASE_URL}/api/v1/user/uuid/reset`, {
    method: 'POST'
  });
};

// 通知功能已移除 - 接口不可用

// 邀请相关：使用现有用户端可用接口（未在新 swagger 中标注，但现网可用）
export const getInviteInfo = async () => {
  return clientFetch(`${BASE_URL}/api/v1/user/invite/fetch`);
};

export const createInviteCode = async () => {
  return clientFetch(`${BASE_URL}/api/v1/user/invite/save`, { method: 'GET' });
};

export const getInviteCommissionRecords = async () => {
  return clientFetch(`${BASE_URL}/api/v1/user/invite/details?page_size=999`);
};

// 转发API的安全fetch函数 - 使用新的安全认证机制
const forwardingClientFetch = async (path: string, options: RequestInit = {}) => {
  // 如果有专门的转发API URL，使用它；否则使用主API的基础URL（去掉/api/v1部分）
  const FORWARDING_API_URL = env.FORWARDING_API_URL || (BASE_URL ? BASE_URL.replace('/api/v1', '') : 'http://localhost:8080');
  
  // 使用安全请求，但针对转发API的特殊URL
  const headers = {
    'Content-Type': 'application/json',
    // 如果有管理员token，优先使用管理员token
    ...(env.FORWARDING_ADMIN_TOKEN && { Authorization: env.FORWARDING_ADMIN_TOKEN }),
    ...options.headers,
  };

  const response = await secureRequest(`${FORWARDING_API_URL}${path}`, {
    ...options,
    headers,
  });

  // 检查响应是否成功
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Forwarding API request failed with status ${response.status}`);
  }
  
  // 返回JSON数据
  return response.json();
};

// ==================== 认证相关的客户端API ====================

// ==================== OAuth 第三方登录相关API ====================

// 获取支持的OAuth提供商列表
export const getOAuthProviders = async () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  const response = await fetch(`${baseUrl}/auth/providers`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to get OAuth providers');
  }

  return data;
};

// 获取OAuth授权URL
export const getOAuthAuthorizationURL = async (provider: string, redirectUri?: string, scopes?: string[], state?: string) => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  const response = await fetch(`${baseUrl}/auth/url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      provider,
      ...(redirectUri && { redirect_uri: redirectUri }),
      ...(scopes && { scopes }),
      ...(state && { state })
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to get OAuth authorization URL');
  }

  return data;
};

// 发起OAuth登录 - 直接重定向到OAuth提供商
export const initiateOAuthLogin = (provider: string) => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  const clientBaseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  // 按照最佳实践使用标准的API回调路径
  const redirectUri = `${clientBaseUrl}/auth/callback/${provider}`;
  const authUrl = `${baseUrl}/auth/${provider}?redirect_uri=${encodeURIComponent(redirectUri)}`;
  
  window.location.href = authUrl;
};

// 处理OAuth回调并获取token - OAuth回调由API路由处理，不需要手动调用
export const handleOAuthCallback = async (provider: string, code?: string, state?: string) => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  const url = new URL(`${baseUrl}/auth/${provider}/callback`);
  
  if (code) url.searchParams.append('code', code);
  if (state) url.searchParams.append('state', state);

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // 确保cookies被正确处理
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'OAuth callback failed');
  }

  return data;
};

// ==================== 传统登录相关API ====================

// 客户端登录函数 - 使用安全的HttpOnly cookies认证
export const login = async (email: string, password: string, rememberMe: boolean = false) => {
  return secureLogin(email, password);
};

// 客户端注册函数 - 使用安全的HttpOnly cookies认证
export const register = async (formData: {
  email: string;
  password: string;
  invite_code?: string;
}) => {
  return secureRegister(formData);
};

// 检查认证状态 - 使用安全的认证检查
export const checkAuthStatus = async () => {
  return secureCheckAuthStatus();
};

// 重置安全信息（UUID）
// ⚠️ 警告：此端点未在swagger.json中定义，可能已废弃或路径已变更
// TODO: 需要后端确认正确的重置安全信息端点
export const resetSecurity = async () => {
  return clientFetch(`${BASE_URL}/api/v1/user/resetSecurity`, {
    method: 'GET'
  });
};

// 获取最近订阅请求记录
// ⚠️ 警告：此端点未在swagger.json中定义，可能已废弃或路径已变更
// TODO: 需要后端确认正确的订阅请求记录端点
export const getRecentSubscriptionRequests = async (token: string) => {
  return clientFetch(`${BASE_URL}/api/v1/client/subscription/recent-requests?token=${token}`);
};

// 客户端登出 - 使用安全的HttpOnly cookies认证
export const logout = async () => {
  return secureLogout();
};

// ==================== 转发相关的客户端API ====================

// 添加转发相关的客户端API
export const getForwardUsers = async (page: number = 1, size: number = 1000) => {
  return forwardingClientFetch(`/api/v1/admin/user?page=${page}&size=${size}`, {
    method: 'GET'
  });
};

export const createForwardUser = async (username: string) => {
  return forwardingClientFetch('/api/v1/admin/user', {
    method: 'PUT',
    body: JSON.stringify({ username }),
  });
};

export const updateForwardUser = async (id: number, user: any) => {
  return forwardingClientFetch(`/api/v1/admin/user/${id}`, {
    method: 'POST',
    body: JSON.stringify(user),
  });
};

export const fetchAdminShopPlans = async () => {
  return forwardingClientFetch('/api/v1/admin/shop/plan', {
    method: 'GET'
  });
};

// ==================== 转发规则相关的客户端API ====================

// 获取转发规则列表
export const getForwardingRules = async (userId: number, page: number = 1, size: number = 10) => {
  return forwardingClientFetch(`/api/v1/admin/user/${userId}/forward?page=${page}&size=${size}`, {
    method: 'GET'
  });
};

// 获取设备组列表
export const getDeviceGroups = async (userId: number) => {
  return forwardingClientFetch(`/api/v1/admin/devicegroup?uid=${userId}`, {
    method: 'GET'
  });
};

// 创建转发规则
export const createForwardingRule = async (
  userId: number,
  data: {
    name: string;
    device_group_in: number;
    device_group_out: number | null;
    config: string;
    listen_port?: number;
  }
) => {
  return forwardingClientFetch(`/api/v1/admin/user/${userId}/forward`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

// 更新转发规则
export const updateForwardingRule = async (
  userId: number,
  ruleId: number,
  data: {
    name: string;
    device_group_in: number;
    device_group_out: number | null;
    config: string;
    listen_port?: number;
  }
) => {
  return forwardingClientFetch(`/api/v1/admin/user/${userId}/forward/${ruleId}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// 诊断转发规则
export const diagnoseForwardingRule = async (userId: number, ruleId: number) => {
  return forwardingClientFetch(`/api/v1/admin/user/${userId}/forward/${ruleId}/diagnose`, {
    method: 'POST'
  });
};

// 删除转发规则
export const deleteForwardingRules = async (userId: number, ids: number[]) => {
  return forwardingClientFetch(`/api/v1/admin/user/${userId}/forward`, {
    method: 'DELETE',
    body: JSON.stringify({ ids }),
  });
};

export default {
  get: (path: string) => clientFetch(`${BASE_URL}${path}`),
  post: (path: string, data?: any) => clientFetch(`${BASE_URL}${path}`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  // Add convenience method for subscription plans
  getPlans: () => getSubscriptionPlans(),
};

// ==================== 工单（Ticket）相关 API（用户侧） ====================
import type { TicketResponse, TicketMessageResponse, CloseTicketRequest, UserCreateTicketRequest } from '@/lib/types';

// 列出当前用户的工单
export const listUserTickets = async (params?: {
  status?: string;
  priority?: string;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ code: number; message: string; data: { items: TicketResponse[]; pagination: { page?: number; limit?: number; total?: number } } }> => {
  const search = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') search.append(k, String(v));
    });
  }
  const qs = search.toString();
  return clientFetch(`${BASE_URL}/tickets/my${qs ? `?${qs}` : ''}`);
};

// 创建工单
export const createUserTicket = async (payload: UserCreateTicketRequest): Promise<{ code: number; message: string; data: TicketResponse }> => {
  return clientFetch(`${BASE_URL}/tickets`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

// 获取工单详情
export const getUserTicket = async (id: number): Promise<{ code: number; message: string; data: TicketResponse }> => {
  return clientFetch(`${BASE_URL}/tickets/${id}`);
};

// 获取工单消息
export const getUserTicketMessages = async (id: number, page?: number, limit?: number): Promise<{
  code: number;
  message: string;
  data: { items: TicketMessageResponse[]; pagination: { page?: number; limit?: number; total?: number } };
}> => {
  const search = new URLSearchParams();
  if (page) search.append('page', String(page));
  if (limit) search.append('limit', String(limit));
  const qs = search.toString();
  return clientFetch(`${BASE_URL}/tickets/${id}/messages${qs ? `?${qs}` : ''}`);
};

// 新增工单消息
export const createUserTicketMessage = async (id: number, payload: {
  content: string;
  attachments?: string;
}): Promise<{ code: number; message: string; data: TicketMessageResponse }> => {
  return clientFetch(`${BASE_URL}/tickets/${id}/messages`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

// 关闭工单
export const closeUserTicket = async (id: number, payload?: CloseTicketRequest): Promise<{ code: number; message: string; data: TicketResponse }> => {
  return clientFetch(`${BASE_URL}/tickets/${id}/close`, {
    method: 'PUT',
    body: JSON.stringify(payload || {}),
  });
};