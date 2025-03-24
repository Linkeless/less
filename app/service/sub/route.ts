import { NextRequest } from 'next/server';
import { getSubscription } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const baseUrl = process.env.NEXT_SUB_API_URL || '';
    const searchParams = request.nextUrl.searchParams.toString();
    const subscribeUrl = searchParams 
      ? `${baseUrl}/api/v1/client/subscribe?${searchParams}`
      : `${baseUrl}/api/v1/client/subscribe`;
      
    const subscription = await fetch(subscribeUrl);
    if (!subscription.ok) {
      return new Response('Subscription not found', { status: 404 });
    }

    const data = await subscription.text();
    const host = request.headers.get('host') || '';
    const webPageUrl = `${request.nextUrl.protocol}//${host}`;

    return new Response(data, {
      headers: {
        'Content-Type': 'text/html',
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
