import { NextRequest, NextResponse } from 'next/server';

// 根据新策略：不再在服务端设置 HttpOnly，转到前端页面由前端设置可读 cookie
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params;
    const url = new URL(request.url);
    const error = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');

    // 若第三方返回错误，直接带错误回登录页
    if (error) {
      const errorMessage = errorDescription || `OAuth 授权失败: ${error}`;
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(errorMessage)}`, request.url));
    }

    // 将浏览器重定向到前端页面，由前端去换取 token 并保存到可读 cookie
    return NextResponse.redirect(new URL(`/auth/callback/${provider}${url.search}`, request.url));
  } catch (error: any) {
    console.error('OAuth callback redirect error:', error);
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message || '登录过程中出现错误，请重试')}`, request.url));
  }
}