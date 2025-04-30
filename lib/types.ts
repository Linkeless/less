export interface UserInfo {
  email: string;
  uuid: string;
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
  avatar_url: string;
  remarks: string;
}

export interface BaseResponse {
  status: string;
  message: string;
  error: string | null;
}

export interface UserInfoResponse extends BaseResponse {
  data: UserInfo;
}

// 移除多余定义，直接使用接口扩展
export interface SubscriptionData {
  plan: PurchasePlan;
  plan_id: number;
  email: string;
  u: number;
  d: number;
  transfer_enable: number;
  expired_at: string | null;
  subscribe_url: string;
  token: string;
  uuid: string;
  reset_day: number | null;
}

export interface SubscriptionResponse extends BaseResponse {
  data: SubscriptionData;
}

// 添加 Subscription 类型别名
export type Subscription = SubscriptionResponse;

export interface TrafficLog {
  created_at: number;
  u: number;
  d: number;
  server_rate?: number;
  record_at?: number;
}

export interface TrafficLogResponse extends BaseResponse {
  data: TrafficLog[];
}

export interface KnowledgeArticle {
  id: number;
  category: string;
  title: string;
  updated_at: string;
}

export interface KnowledgeResponse extends BaseResponse {
  data: KnowledgeArticle[];
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

export interface Order {
  trade_no: string;
  created_at: number;
  total_amount: number;
  status: number;
  status_text: string;
  payment_method: string;
  goods_name: string;
  period?: string;
}

export interface APIResponse<T = any> {
  status: 'success' | 'fail';
  message: string;
  data: T;
  error: string | null;
}

export interface OrdersResponse extends APIResponse {
  data: Order[];
}

export interface TicketResponse extends BaseResponse {
  data: Array<{
    id: number;
    subject: string;
    status: string;
    created_at: number;
  }>;
}

export interface OrderDetailResponse extends BaseResponse {
  data: {
    id: number;
    plan_id: number;
    trade_no: string;
    total_amount: number;
    discount_amount: number | null;
    balance_amount: number;
    period: string;
    status: number;
    plan: {
      name: string;
      content: string;
      transfer_enable: number;
      onetime_price: number | null;
    };
  };
}

export interface PaymentMethodResponse extends BaseResponse {
  data: Array<{
    id: number;
    name: string;
    icon: string;
    handling_fee_percent: number;
  }>;
}

export interface ResetUUIDResponse extends BaseResponse {
  data: {
    uuid: string;
  };
}

export interface PlanResponse extends BaseResponse {
  data: PurchasePlan[];
}

export interface OrderResponse extends BaseResponse {
  data: string; // trade_no
}

export interface CheckoutResponse extends BaseResponse {
  data: {
    type: number;  // -1/0 for boolean results, 1 for URL redirect
    data: string;  // boolean for type -1/0, string (URL) for type 1
  };
}

export interface CouponResponse extends BaseResponse {
  data: {
    value: number;
    type: 1 | 2;  // 1 for fixed amount, 2 for percentage
  } | null;
}

export interface ForwardUser {
  id: number;
  username: string;
  balance: string;
  aff_balance: string;
  inviter: number;
  invite_config: string;
  invite_code: string;
  plan_id: number;
  group_id: number;
  max_rules: number;
  speed_limit: number;
  ip_limit: number;
  connection_limit: number;
  traffic_enable: number;
  traffic_used: number;
  expire: number;
  auto_renew: boolean;
  banned: boolean;
  admin: boolean;
  allow_device: boolean;
  telegram_id: number;
  telegram_notify: string;
  display_traffic: any;
}

export interface ShopPlan {
  id: number;
  type: string;
  name: string;
  desc: string;
  price: string;
  multiple: number;
  show_order: number;
  hide: boolean;
  group_id: number;
  max_rules: number;
  traffic: number;
  speed_limit: number;
  ip_limit: number;
  connection_limit: number;
}

export interface AdminShopPlansResponse {
  code: number;
  data: ShopPlan[];
  msg: string;
}

// Add other type definitions as needed...
