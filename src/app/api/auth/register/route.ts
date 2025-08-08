import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password, invite_code } = await request.json();

    // 验证输入
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // 调用后端API进行注册
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    const response = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        ...(invite_code && { invite_code })
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Registration failed' },
        { status: response.status }
      );
    }

    // 注册成功，如果有认证数据则设置HttpOnly cookie (自动登录)
    if (data.data?.auth_data) {
      const nextResponse = NextResponse.json(data);
      
      nextResponse.cookies.set('auth_data', data.data.auth_data, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60, // 1天
        path: '/',
      });

      return nextResponse;
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Register API error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}