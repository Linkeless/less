const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('auth_data');
      window.location.href = '/login';
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
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

interface Plan {
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
}

interface SubscriptionResponse {
  status: string;
  message: string;
  data: {
    plan_id: number;
    token: string;
    expired_at: string | null;
    u: number;
    d: number;
    transfer_enable: number;
    email: string;
    uuid: string;
    plan: Plan;
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

interface PurchasePlan {
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

interface UserInfo {
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

export const getSubscription = async (): Promise<SubscriptionResponse> => {
  const token = localStorage.getItem('auth_data');
  if (!token) {
    throw new Error('No authentication token found');
  }
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


export default {
  get: (url: string) => createRequest(url),
  post: (url: string, data?: any) => createRequest(url, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};
