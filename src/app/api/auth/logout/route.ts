import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  // 清除 auth_data cookie (包括HttpOnly的)
  (await cookies()).delete('auth_data');
  
  return NextResponse.json({ success: true });
}
