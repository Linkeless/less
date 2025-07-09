import { NextRequest } from 'next/server';
import { env } from '@/env.config';

export async function GET(request: NextRequest) {
  try { 
    const baseUrl = env.SUB_API_URL;
    // 直接使用原始 URL 的查询参数部分
    const originalUrl = new URL(request.url);
    
    // 获取客户端 IP 地址
    const clientIp = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    '';    
    // 构建包含 IP 参数的 URL
    const urlSearchParams = new URLSearchParams(originalUrl.search);
    urlSearchParams.append('ip', clientIp);
    const subscribeUrl = `${baseUrl}/api/v1/client/subscribe?${urlSearchParams.toString()}`;
      
    const userAgent = request.headers.get('user-agent') || '';
    const host = request.headers.get('host') || '';
    // 获取完整的原始路径，包括查询参数
    const fullPath = originalUrl.pathname + originalUrl.search;
    const scheme = request.nextUrl.protocol.replace(':', '');
    const surgeSub = `${scheme}://${host}${fullPath}`;

    // 准备发送到 API 的请求头
    const apiHeaders = {
      'User-Agent': userAgent,
      'Surge-Sub': surgeSub,
    };
    

    const subscription = await fetch(subscribeUrl, {
      headers: apiHeaders
    });

    const data = await subscription.text();
    const webPageUrl = `${request.nextUrl.protocol}//${host}`;

    // 检查是否是 JSON 格式的错误响应
    if (!subscription.ok) {
      try {
        const jsonData = JSON.parse(data);
        return new Response(JSON.stringify(jsonData), {
          status: subscription.status,
          headers: {
            'Content-Type': 'application/json; charset=UTF-8',
            'Cache-Control': 'no-cache',
          },
        });
      } catch {
        // 如果不是 JSON 格式，返回原始数据
        return new Response(data, {
          status: subscription.status,
          headers: {
            'Content-Type': 'text/plain; charset=UTF-8',
            'Cache-Control': 'no-cache',
          },
        });
      }
    }

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
