import { NextRequest, NextResponse } from 'next/server';
import { handleOAuthCallback } from '@/lib/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params;
    const { searchParams } = new URL(request.url);
    
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // 如果有错误参数，返回错误页面
    if (error) {
      const errorMessage = errorDescription || `OAuth 授权失败: ${error}`;
      const errorUrl = `/login?error=${encodeURIComponent(errorMessage)}`;
      return NextResponse.redirect(new URL(errorUrl, request.url));
    }

    // 处理OAuth回调
    const result = await handleOAuthCallback(provider, code || undefined, state || undefined);

    if (result.data?.auth_data) {
      // OAuth登录成功，重定向到仪表板
      const dashboardUrl = new URL('/dashboard', request.url);
      const response = NextResponse.redirect(dashboardUrl);
      
      // 设置HttpOnly cookie存储认证数据
      response.cookies.set('auth_data', result.data.auth_data, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30天
        path: '/',
      });

      return response;
    } else {
      // 登录失败，重定向到登录页面并显示错误
      const errorUrl = `/login?error=${encodeURIComponent(result.message || 'OAuth 登录失败')}`;
      return NextResponse.redirect(new URL(errorUrl, request.url));
    }
  } catch (error: any) {
    console.error('OAuth callback error:', error);
    
    // 出现异常，重定向到登录页面并显示错误
    const errorUrl = `/login?error=${encodeURIComponent(error.message || '登录过程中出现错误，请重试')}`;
    return NextResponse.redirect(new URL(errorUrl, request.url));
  }
}