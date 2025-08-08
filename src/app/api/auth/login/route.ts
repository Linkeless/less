import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password, rememberMe } = await request.json();

    // 验证输入
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // 调用后端API进行登录
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    const response = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Login failed' },
        { status: response.status }
      );
    }

    // 登录成功，设置HttpOnly cookie
    if (data.data?.auth_data || data.status === 'success') {
      // 确保有认证数据才设置cookie
      const authData = data.data?.auth_data;
      if (authData) {
        const nextResponse = NextResponse.json({
          ...data,
          status: 'success', // 确保返回成功状态
        });
        
        // 根据rememberMe设置不同的过期时间
        const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60; // 30天 或 1天
        
        nextResponse.cookies.set('auth_data', authData, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: maxAge,
          path: '/',
        });

        return nextResponse;
      }
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}