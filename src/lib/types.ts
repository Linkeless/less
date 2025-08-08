// 根据swagger.json entities.UserResponse定义的用户信息
export interface UserInfo {
  id: number;
  email: string;
  name?: string;
  username?: string;
  avatar?: string;
  role?: string;
  status?: string;
  provider?: string;
  provider_data?: string;
  google_id?: string;
  github_id?: string;
  telegram_id?: string;
  invite_code_id?: number;
  invite_code_used?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
  // 兼容旧版本字段
  uuid?: string;
  transfer_enable?: number;
  last_login_at?: number;
  banned?: number;
  remind_expire?: number;
  remind_traffic?: number;
  expired_at?: string | null;
  balance?: number;
  commission_balance?: number;
  plan_id?: number;
  discount?: number | null;
  commission_rate?: number | null;
  avatar_url?: string;
  remarks?: string;
  // 流量字段
  u?: number;
  d?: number;
}

export interface BaseResponse {
  status: string;
  message: string;
  error: string | null;
}

// 用户信息响应 - 使用StandardResponse格式
export interface UserInfoResponse extends StandardResponse {
  data: UserInfo;
}

// 根据swagger.json StandardResponse定义的标准响应格式
export interface StandardResponse {
  code: number;
  message: string;
  data?: any;
}

// 根据swagger.json定义的分页响应格式
export interface PaginatedResponse extends StandardResponse {
  data: any[];
  limit?: number;
  offset?: number;
  total?: number;
}

// 根据swagger.json定义的UserSubscriptionResponse (正确的订阅数据结构)
export interface UserSubscriptionResponse {
  id: number;
  user_id: number;
  subscription_plan_id: number;
  status: string;
  auto_renew: boolean;
  billing_cycle: string;
  billing_interval: number;
  cancel_at_period_end: boolean;
  cancellation_reason?: string;
  cancelled_at?: string;
  created_at: string;
  currency: string;
  current_period_end: string;
  current_period_start: string;
  days_left?: number;
  end_date?: string;
  is_expired?: boolean;
  is_in_trial?: boolean;
  is_max_pause_duration_exceeded?: boolean;
  is_paused?: boolean;
  last_renewal_failed?: string;
  last_used_at?: string;
  max_pause_duration?: number;
  next_billing_date?: string;
  pause_duration_days?: number;
  pause_reason?: string;
  paused_at?: string;
  paused_by_admin_id?: number;
  price: number;
  remaining_pause_days?: number;
  renewal_attempts?: number;
  renewal_fail_reason?: string;
  resumed_at?: string;
  resumed_by_admin_id?: number;
  start_date: string;
  trial_end_date?: string;
  updated_at: string;
  uuid?: string;
  subscription_plan?: SubscriptionPlanResponse;
  user?: any; // UserBasicDTO
}

// 订阅订单响应类型 - 更新以匹配新的API结构
export interface SubscriptionOrderResponse {
  id: number;
  user_id: number;
  subscription_plan_id: number;
  order_number: string;
  order_type: 'new' | 'renewal' | 'upgrade' | 'downgrade';
  amount: number;
  total_amount: number;
  discount_amount?: number;
  discount_type?: string;
  discount_value?: number;
  currency: string;
  status: string;
  payment_gateway?: string;
  payment_method?: string;
  payment_method_id?: number;
  paid_at?: string;
  billing_period_start?: string;
  billing_period_end?: string;
  coupon_code?: string;
  invoice_number?: string;
  invoice_status?: string;
  invoiced_at?: string;
  metadata?: string;
  return_url?: string;
  created_at: string;
  updated_at: string;
  subscription_plan?: SubscriptionPlanResponse;
}

// 订阅计划响应类型
export interface SubscriptionPlanResponse {
  id: number;
  name: string;
  description?: string;
  price: number;
  currency: string;
  billing_period: string;
  features?: string[];
  created_at: string;
  updated_at: string;
}

// 用户订阅分页响应 (根据swagger.json的/subscriptions/my接口)
export interface UserSubscriptionsResponse extends PaginatedResponse {
  data: UserSubscriptionResponse[];
}

// 订阅订单分页响应 (用于订单相关接口)
export interface SubscriptionOrdersResponse extends StandardResponse {
  data: SubscriptionOrderResponse[];
  total?: number;
  limit?: number;
  offset?: number;
}

// 创建订单请求类型
export interface CreateSubscriptionOrderRequest {
  subscription_plan_id: number;
  order_type: 'new' | 'renewal' | 'upgrade' | 'downgrade';
  payment_gateway: string;
  payment_method: string;
  coupon_code?: string;
  user_id?: number;
  payment_method_id?: number;
  return_url?: string;
  use_default_payment?: boolean;
  metadata?: string;
}

// 创建订单响应类型
export interface CreateSubscriptionOrderResponse extends StandardResponse {
  data: {
    id: number;
    order_number: string;
    payment_url?: string;
    payment_no?: string;
    total_amount: number;
  };
}


// 更新 Subscription 类型别名指向正确的用户订阅响应格式
export type Subscription = UserSubscriptionsResponse;

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

// 新的订阅计划类型 - 根据实际API数据结构
export interface SubscriptionPlan {
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
}

// 保持向后兼容的旧版本类型（用于迁移期间）
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

// 更新Order类型以匹配新的订单API结构
export interface Order {
  id: number;
  order_number: string;
  trade_no?: string; // 保持兼容性
  total_amount: number;
  amount: number;
  status: string | number; // 支持新API的字符串格式和旧格式的数字
  status_text?: string; // 保持兼容性
  payment_method?: string;
  payment_gateway?: string;
  order_type: 'new' | 'renewal' | 'upgrade' | 'downgrade';
  goods_name?: string; // 保持兼容性
  period?: string; // 保持兼容性
  billing_period_start?: string;
  billing_period_end?: string;
  coupon_code?: string;
  discount_amount?: number;
  currency: string;
  paid_at?: string;
  created_at: string | number; // 支持时间戳和ISO字符串格式
  updated_at: string;
  subscription_plan?: SubscriptionPlanResponse;
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

// 旧版 TicketResponse（包含 subject 等字段）已废弃，避免与新版冲突，若仍需请改名使用

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

// 新的订阅计划响应类型 - 匹配实际API数据结构
export interface SubscriptionPlansResponse extends StandardResponse {
  data: SubscriptionPlan[];
  total: number;
  limit: number;
  offset: number;
}

// 保持向后兼容的旧版本响应类型
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

export interface IPDetails {
  ip: string;
  hostname?: string;
  city?: string;
  region?: string;
  region_code?: string;
  country?: string;
  country_code?: string;
  loc?: string;
  latitude?: number;
  longitude?: number;
  org?: string;
  organization?: string;
  asn?: number;
  asn_organization?: string;
  isp?: string;
  postal?: string;
  timezone?: string;
  continent_code?: string;
  offset?: number;
  readme?: string;
}

export interface RecentSubscriptionRequest {
  ip: string;
  datetime: string;
  user_agent: string;
  host: string[] | string;
  ip_details?: IPDetails;
}

export interface RecentSubscriptionRequestsResponse {
  success: boolean;
  data: {
    user_id: number;
    total_requests: number;
    recent_requests: RecentSubscriptionRequest[];
  };
}

// Add other type definitions as needed...

// ==================== 工单（Ticket）相关类型（按照 swagger.json 对齐） ====================

export interface UserBasicDTO {
  id: number;
  email?: string;
  name?: string;
  username?: string;
  avatar_url?: string;
}

export interface TicketMessageResponse {
  attachments?: string; // JSON 字符串
  content: string;
  created_at: string;
  id: number;
  is_internal?: boolean;
  message_type?: string; // admin/user/system
  metadata?: string;
  ticket_id: number;
  updated_at: string;
  user?: UserBasicDTO;
  user_id?: number;
}

export interface TicketResponse {
  assigned_at?: string;
  assigned_to?: UserBasicDTO;
  assigned_to_id?: number;
  category?: string; // subscription/payment/billing/...
  closed_at?: string;
  created_at: string;
  description?: string;
  first_response_at?: string;
  id: number;
  last_response_at?: string;
  messages?: TicketMessageResponse[];
  metadata?: string;
  priority?: string; // low/normal/high/urgent/critical
  resolution?: string;
  resolved_at?: string;
  resolved_by?: UserBasicDTO;
  resolved_by_id?: number;
  status: string; // open/in_progress/pending/resolved/closed
  tags?: string; // 逗号分隔字符串
  ticket_no: string;
  title: string;
  updated_at: string;
  user?: UserBasicDTO;
  user_id: number;
}

export interface CloseTicketRequest {
  reason?: string;
}

export interface UserCreateTicketRequest {
  category: 'general' | 'technical' | 'billing' | 'account' | 'feature' | 'bug' | 'subscription' | 'payment';
  title: string; // 5-255 chars
  description: string; // 10-5000 chars
  priority?: 'low' | 'normal' | 'high' | 'urgent' | 'critical';
  tags?: string; // 以逗号分隔
  metadata?: string; // JSON 字符串
}

export interface PaginationResponse {
  limit?: number;
  page?: number;
  total?: number;
}

export interface ListDataInfo<T = any> {
  items: T[];
  pagination: PaginationResponse;
}

export interface StandardListResponse<T = any> {
  code: number;
  message: string;
  data: ListDataInfo<T>;
}

// =============== 邀请相关（使用现有后端用户端接口） ===============
export interface InviteCodeItem {
  code: string;
}

export interface InviteInfoData {
  codes: InviteCodeItem[];
  stat: number[]; // [invitedCount, totalCommission, ..., commissionRate?] 兼容旧格式
}

export interface InviteInfoResponse extends BaseResponse {
  data: InviteInfoData;
}

export interface CommissionRecord {
  id: number;
  trade_no: string;
  order_amount: number; // cents
  get_amount: number; // cents
  created_at: number; // seconds timestamp
}

export interface CommissionRecordsResponse extends BaseResponse {
  data: CommissionRecord[];
}
