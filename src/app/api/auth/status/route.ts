import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('auth_data');
    
    if (authCookie?.value) {
      return NextResponse.json({ 
        isLoggedIn: true,
        authData: authCookie.value 
      });
    } else {
      return NextResponse.json({ 
        isLoggedIn: false,
        authData: null 
      });
    }
  } catch (error) {
    console.error('检查登录状态失败:', error);
    return NextResponse.json({ 
      isLoggedIn: false,
      authData: null 
    });
  }
} 