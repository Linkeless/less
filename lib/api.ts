const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

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

interface SubscriptionResponse {
  status: string;
  message: string;
  data: {
    plan_id: number;
    plan: { 
      name: string;
      id: number;
    };
    token: string;
    expired_at: string | null;
    u: number;
    d: number;
    transfer_enable: number;
    email: string;
    uuid: string;
    subscribe_url: string;
    reset_day: number | null;
  };
  error: string | null;
}

interface KnowledgeArticle {
  id: number;
  category: string;
  title: string;
  updated_at: string;
}

interface KnowledgeResponse {
  status: string;
  message: string;
  data: {
    [category: string]: Array<{
      id: number;
      category: string;
      title: string;
      updated_at: number;
    }>;
  };
  error: null;
}

export interface PurchasePlan {
  id: number;
  group_id: number;
  transfer_enable: number;
  name: string;
  speed_limit: number | null;
  show: number;
  sort: number;
  renew: number;
  content: string;
  month_price: number | null;
  quarter_price: number | null;
  half_year_price: number | null;
  year_price: number | null;
  two_year_price: number | null;
  three_year_price: number | null;
  onetime_price: number | null;
  reset_price: number | null;
  reset_traffic_method: number | null;
  capacity_limit: number | null;
  created_at: number;
  updated_at: number;
}

interface PlanResponse {
  status: string;
  message: string;
  data: PurchasePlan[];
  error: string | null;
}

interface TicketResponse {
  status: string;
  message: string;
  data: Array<{
    id: number;
    subject: string;
    status: string;
    created_at: number;
  }>;
  error: null;
}

export interface UserInfo {
  status: string;
  message: string;
  data: {
    email: string;
    transfer_enable: number;
    last_login_at: number;
    created_at: number;
    banned: number;
    remind_expire: number;
    remind_traffic: number;
    expired_at: string | null;
    balance: number;
    commission_balance: number;
    plan_id: number;
    discount: number | null;
    commission_rate: number | null;
    telegram_id: number;
    uuid: string;
    avatar_url: string;
  };
  error: null;
}

interface ResetUUIDResponse {
  status: string;
  message: string;
  data: {
    uuid: string;
  };
  error: null;
}

interface CouponResponse {
  status: string;
  message: string;
  data: {
    discount: number;
  } | null;
  error: string | null;
}

interface FetchProductResponse {
  status: string;
  message: string;
  data: PurchasePlan;
  error: string | null;
}

interface OrderResponse {
  status: string;
  message: string;
  data: string; // trade_no
  error: null;
}

interface OrderDetailResponse {
  status: string;
  message: string;
  data: {
    id: number;
    invite_user_id: number | null;
    user_id: number;
    plan_id: number;
    coupon_id: number | null;
    payment_id: number | null;
    type: number;
    period: string;
    trade_no: string;
    callback_no: string;
    total_amount: number;
    handling_amount: number | null;
    discount_amount: number | null;
    surplus_amount: number | null;
    refund_amount: number | null;
    balance_amount: number;
    surplus_order_ids: string | null;
    status: number;
    commission_status: number;
    commission_balance: number;
    actual_commission_balance: number | null;
    paid_at: number;
    created_at: number;
    updated_at: number;
    plan: {
      id: number;
      group_id: number;
      transfer_enable: number;
      name: string;
      speed_limit: number | null;
      show: number;
      sort: number;
      renew: number;
      content: string;
      month_price: number;
      quarter_price: number;
      half_year_price: number;
      year_price: number;
      two_year_price: number | null;
      three_year_price: number | null;
      onetime_price: number | null;
      reset_price: number | null;
      reset_traffic_method: number | null;
      capacity_limit: number | null;
      created_at: number;
      updated_at: number;
    };
    try_out_plan_id: number;
  };
  error: null;
}

interface PaymentMethodResponse {
  status: string;
  message: string;
  data: Array<{
    id: number;
    name: string;
    icon: string;
    handling_fee_percent: number;
  }>;
  error: null;
}

interface OrdersResponse {
  status: string;
  message: string;
  data: Array<{
    trade_no: string;
    created_at: number;
    total_amount: number;
    status: number;
    status_text: string;
    payment_method: string;
    goods_name: string;
  }>;
  error: null;
}

interface CheckoutResponse {
  type: number;
  data: string;  // boolean for type -1/0, string (URL) for type 1
}

interface TrafficLogResponse {
  status: string;
  message: string;
  data: Array<{
    created_at: number;
    u: number;
    d: number;
  }>;
  error: null;
}

export const getSubscription = async (): Promise<SubscriptionResponse> => {
  return createRequest('/api/v1/user/getSubscribe');
};

export const sendEmailVerify = async (email: string) => {
  return createRequest('/api/v1/passport/comm/sendEmailVerify', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
};

export const fetchKnowledge = async (): Promise<KnowledgeResponse> => {
  return createRequest('/api/v1/user/knowledge/fetch?language=zh-CN');
};

export const fetchPlans = async (): Promise<PlanResponse> => {
  return createRequest('/api/v1/user/plan/fetch');
};

export const fetchTickets = async (): Promise<TicketResponse> => {
  return createRequest('/api/v1/user/ticket/fetch');
};

export const fetchUserInfo = async (): Promise<UserInfo> => {
  return createRequest('/api/v1/user/info');
};

export const resetUUID = async (): Promise<ResetUUIDResponse> => {
  return createRequest('/api/v1/user/uuid/reset', {
    method: 'POST',
  });
};

export const fetchProduct = async (id: string): Promise<FetchProductResponse> => {
  const response = await createRequest(`/api/v1/user/plan/fetch?id=${id}`);
  if (Array.isArray(response.data)) {
    return {
      ...response,
      data: response.data[0]
    };
  }
  return response;
};

export const checkCoupon = async (code: string): Promise<CouponResponse> => {
  return createRequest('/api/v1/user/coupon/check', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
};

export const createOrder = async (params: {
  period: string;
  plan_id: number;
  coupon_code?: string;
}): Promise<OrderResponse> => {
  const searchParams = new URLSearchParams();
  searchParams.append('period', params.period);
  searchParams.append('plan_id', params.plan_id.toString());
  searchParams.append('coupon_code', params.coupon_code || '');
  
  return createRequest(`/api/v1/user/order/save?${searchParams}`, {
    method: 'POST'
  });
};

export const getOrderDetail = async (trade_no: string): Promise<OrderDetailResponse> => {
  return createRequest(`/api/v1/user/order/detail?trade_no=${trade_no}`);
};

export const getPaymentMethods = async (): Promise<PaymentMethodResponse> => {
  return createRequest('/api/v1/user/order/getPaymentMethod');
};

export const fetchOrders = async (): Promise<OrdersResponse> => {
  return createRequest('/api/v1/user/order/fetch');
};

export const cancelOrder = async (trade_no: string): Promise<{ status: string; message: string }> => {
  return createRequest(`/api/v1/user/order/cancel?trade_no=${trade_no}`, {
    method: 'POST'
  });
};

export const checkout = async (trade_no: string, method: number): Promise<CheckoutResponse> => {
  return createRequest(`/api/v1/user/order/checkout?trade_no=${trade_no}&method=${method}`, {
    method: 'POST'
  });
};

export const getTrafficLog = async (): Promise<TrafficLogResponse> => {
  return createRequest('/api/v1/user/stat/getTrafficLog');
};

export default {
  get: (url: string) => createRequest(url),
  post: (url: string, data?: any) => createRequest(url, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};
