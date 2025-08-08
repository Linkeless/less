/**
 * Bearer Token + Cookies 认证客户端
 * 
 * 核心特性：
 * 1. Bearer Token 认证 - Authorization: Bearer <token>
 * 2. Cookies 安全存储 - 支持 secure, sameSite 等安全选项
 * 3. 自动token刷新 - 无感知续期
 * 4. 防并发刷新 - 避免重复请求
 * 5. 统一错误处理 - 401智能重试
 */

import { env } from '@/env.config';

const BASE_URL = env.NEXT_PUBLIC_API_URL;
const TOKEN_COOKIE_NAME = 'auth_token';

/**
 * Cookie 操作工具类
 */
class CookieManager {
  /**
   * 设置cookie
   */
  static setCookie(name: string, value: string, days: number = 7): void {
    try {
      if (typeof window === 'undefined') return;
      
      const expires = new Date();
      expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
      
      const cookieValue = [
        `${name}=${encodeURIComponent(value)}`,
        `expires=${expires.toUTCString()}`,
        'path=/',
        'SameSite=Lax',
        // 生产环境启用 Secure
        ...(location.protocol === 'https:' ? ['Secure'] : [])
      ].join('; ');
      
      document.cookie = cookieValue;
      console.log(`Bearer Token已存储到cookie: ${name}`);
    } catch (error) {
      console.error('设置cookie失败:', error);
    }
  }

  /**
   * 获取cookie值
   */
  static getCookie(name: string): string | null {
    try {
      if (typeof window === 'undefined') return null;
      
      const nameEQ = name + "=";
      const cookies = document.cookie.split(';');
      
      for (let cookie of cookies) {
        let c = cookie.trim();
        if (c.indexOf(nameEQ) === 0) {
          return decodeURIComponent(c.substring(nameEQ.length));
        }
      }
      return null;
    } catch (error) {
      console.error('获取cookie失败:', error);
      return null;
    }
  }

  /**
   * 删除cookie
   */
  static deleteCookie(name: string): void {
    try {
      if (typeof window === 'undefined') return;
      
      document.cookie = [
        `${name}=`,
        'expires=Thu, 01 Jan 1970 00:00:00 UTC',
        'path=/'
      ].join('; ');
      
      console.log(`Cookie已删除: ${name}`);
    } catch (error) {
      console.error('删除cookie失败:', error);
    }
  }
}

/**
 * Bearer Token + Cookies 认证管理器 - 单例模式
 */
class AuthManager {
  private static instance: AuthManager;
  private refreshPromise: Promise<boolean> | null = null;
  private isRefreshing = false;
  private isRedirecting = false;
  private failedRequestsCount = 0;
  private maxFailedRequests = 3; // 最大失败请求次数

  private constructor() {}

  static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager();
    }
    return AuthManager.instance;
  }

  /**
   * 获取存储在cookie中的认证token
   */
  private getToken(): string | null {
    return CookieManager.getCookie(TOKEN_COOKIE_NAME);
  }

  /**
   * 存储认证token到cookie
   */
  private setToken(token: string, expireDays: number = 7): void {
    CookieManager.setCookie(TOKEN_COOKIE_NAME, token, expireDays);
  }

  /**
   * 清除认证token
   */
  private clearToken(): void {
    CookieManager.deleteCookie(TOKEN_COOKIE_NAME);
  }

  /**
   * 安全HTTP请求 - 自动处理Bearer认证和刷新
   */
  async secureRequest(url: string, options: RequestInit = {}): Promise<Response> {
    // 检查失败次数，如果超过限制，直接重定向
    if (this.failedRequestsCount >= this.maxFailedRequests) {
      console.error('认证失败次数过多，停止重试');
      this.redirectToLogin();
      return new Response(JSON.stringify({ message: 'Too many authentication failures' }), { status: 401 });
    }

    // 第一次尝试请求
    let response = await this.makeRequest(url, options);
    
    // 如果是401错误且不是登录或刷新请求，尝试刷新token
    if (response.status === 401 && !this.isAuthEndpoint(url)) {
      this.failedRequestsCount++;
      
      const refreshSuccess = await this.refreshToken();
      
      if (refreshSuccess) {
        // 刷新成功，重置失败次数并重试原请求
        this.failedRequestsCount = 0;
        response = await this.makeRequest(url, options);
      } else {
        // 刷新失败，重定向到登录页面
        console.error(`认证刷新失败 (${this.failedRequestsCount}/${this.maxFailedRequests})`);
        this.redirectToLogin();
      }
    } else if (response.ok) {
      // 请求成功，重置失败次数
      this.failedRequestsCount = 0;
    }
    
    return response;
  }

  /**
   * 发起HTTP请求 - 从cookies中获取token并添加到Authorization头
   */
  private async makeRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // 从cookies中获取token并添加Authorization头
    const token = this.getToken();
    if (token) {
      (headers as any)['Authorization'] = `Bearer ${token}`;
    }

    return fetch(url, {
      ...options,
      headers,
    });
  }

  /**
   * 刷新认证token - 防并发机制
   */
  private async refreshToken(): Promise<boolean> {
    // 如果已经在刷新中，等待当前刷新完成
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.performRefresh();

    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  /**
   * 执行token刷新操作
   */
  private async performRefresh(): Promise<boolean> {
    try {
      const currentToken = this.getToken();
      if (!currentToken) {
        return false;
      }

      const response = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`
        },
      });

      if (response.ok) {
        const data = await response.json();
        const newToken = data.data?.token?.access_token;
        
        if (newToken) {
          this.setToken(newToken);
          console.log('Bearer Token刷新成功，已更新cookie');
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Token刷新失败:', error);
      return false;
    }
  }

  /**
   * 检查是否为认证相关端点
   */
  private isAuthEndpoint(url: string): boolean {
    return url.includes('/auth/login') || 
           url.includes('/auth/register') || 
           url.includes('/auth/refresh');
  }

  /**
   * 重定向到登录页面
   */
  private redirectToLogin(): void {
    // 防止重复重定向
    if (this.isRedirecting) {
      return;
    }
    
    this.isRedirecting = true;
    console.log(`认证失败，重定向到登录页面 (失败次数: ${this.failedRequestsCount})`);
    
    // 清理所有状态
    this.clearToken();
    this.isRefreshing = false;
    this.refreshPromise = null;
    this.failedRequestsCount = 0;
    
    if (typeof window !== 'undefined') {
      // 延迟重定向，避免并发问题，并确保所有状态已清理
      setTimeout(() => {
        window.location.href = '/login';
      }, 200); // 增加延迟时间
    }
  }

  /**
   * 本地检查token是否存在（不发起HTTP请求）
   */
  hasValidToken(): boolean {
    const token = this.getToken();
    return !!token;
  }

  /**
   * 检查认证状态（发起HTTP请求验证token）
   */
  async checkAuthStatus(): Promise<{ isLoggedIn: boolean; userData?: any }> {
    try {
      const token = this.getToken();
      if (!token) {
        return { isLoggedIn: false };
      }

      const response = await this.makeRequest(`${BASE_URL}/user/profile`);
      
      if (response.ok) {
        const data = await response.json();
        return { 
          isLoggedIn: true, 
          userData: data.data 
        };
      } else {
        return { isLoggedIn: false };
      }
    } catch (error) {
      console.error('检查认证状态失败:', error);
      return { isLoggedIn: false };
    }
  }

  /**
   * Bearer Token登录 - token存储在cookies中
   */
  async login(email: string, password: string, rememberMe: boolean = false): Promise<any> {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    // 提取Bearer token - 根据实际API响应格式: data.token.access_token
    const token = data.data?.token?.access_token;

    if (token) {
      const expireDays = rememberMe ? 30 : 7; // 记住我：30天，否则7天
      this.setToken(token, expireDays);
      // 登录成功，重置所有状态
      this.failedRequestsCount = 0;
      this.isRedirecting = false;
      console.log(`登录成功，Bearer Token已存储到cookies (${expireDays}天过期)`);
    } else {
      console.error('登录响应中未找到认证token，完整响应:', data);
      throw new Error('认证token缺失');
    }
    
    return data;
  }

  /**
   * Bearer Token注册 - token存储在cookies中
   */
  async register(formData: { email: string; password: string; invite_code?: string }): Promise<any> {
    const response = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }

    // 提取Bearer token并存储到cookies（如果自动登录）
    const token = data.data?.token?.access_token;
    if (token) {
      this.setToken(token);
      console.log('注册成功，Bearer Token已存储到cookies');
    } else {
      console.log('注册成功，需要手动登录');
    }

    return data;
  }

  /**
   * 安全登出 - 清理cookies中的Bearer token
   */
  async logout(): Promise<boolean> {
    try {
      const token = this.getToken();
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      };

      const response = await fetch(`${BASE_URL}/auth/logout`, {
        method: 'POST',
        headers,
      });

      // 无论请求是否成功，都清理cookies中的token
      this.clearToken();
      
      console.log('登出完成，Bearer Token已从cookies中清除');
      return response.ok;
    } catch (error) {
      console.error('登出错误:', error);
      // 即使请求失败，也要清理cookies中的token
      this.clearToken();
      return false;
    }
  }
}

/**
 * 导出Bearer Token + Cookies认证API请求函数
 */
const authManager = AuthManager.getInstance();

export const secureRequest = authManager.secureRequest.bind(authManager);

/**
 * 兼容旧版本的导出
 */
export const login = authManager.login.bind(authManager);
export const register = authManager.register.bind(authManager);
export const logout = authManager.logout.bind(authManager);
export const checkAuthStatus = authManager.checkAuthStatus.bind(authManager);
export const hasValidToken = authManager.hasValidToken.bind(authManager);