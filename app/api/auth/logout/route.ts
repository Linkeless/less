import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  // 清除 auth_data cookie (包括HttpOnly的)
  (await cookies()).delete('auth_data');
  
  // 可能需要清除的其他认证相关cookie
  (await cookies()).delete('session');
  
  return NextResponse.json({ success: true });
}
