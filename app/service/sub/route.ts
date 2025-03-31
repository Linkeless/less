import { NextRequest } from 'next/server';
import { env } from '@/env.config';

export async function GET(request: NextRequest) {
  try { 
    const baseUrl = env.SUB_API_URL;
    // 直接使用原始 URL 的查询参数部分
    const originalUrl = new URL(request.url);
    const subscribeUrl = `${baseUrl}/api/v1/client/subscribe${originalUrl.search}`;
      
    const userAgent = request.headers.get('user-agent') || '';
    const host = request.headers.get('host') || '';
    // 获取完整的原始路径，包括查询参数
    const fullPath = originalUrl.pathname + originalUrl.search;
    const scheme = request.nextUrl.protocol.replace(':', '');
    const surgeSub = `${scheme}://${host}${fullPath}`;

    const subscription = await fetch(subscribeUrl, {
      headers: {
        'User-Agent': userAgent,
        'Surge-Sub': surgeSub,
      }
    });

    if (!subscription.ok) {
      return new Response('Subscription not found', { status: 404 });
    }

    const data = await subscription.text();
    const webPageUrl = `${request.nextUrl.protocol}//${host}`;

    return new Response(data, {
      headers: {
        'Content-Type': 'text/html; charset=UTF-8',
        'Cache-Control': 'no-cache',        
        'Content-Disposition': subscription.headers.get('content-disposition') || '',
        'Profile-Update-Interval': subscription.headers.get('profile-update-interval') || '',
        'Profile-Web-Page-Url': webPageUrl,
        'Subscription-Userinfo': subscription.headers.get('subscription-userinfo') || '',
      },
    });
  } catch (error) {
    console.error('Subscription proxy error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
