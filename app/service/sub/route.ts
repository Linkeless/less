import { NextRequest } from 'next/server';
import { getSubscription } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const subscription = await getSubscription();
    if (!subscription?.data?.subscribe_url) {
      return new Response('Subscription not found', { status: 404 });
    }

    const filter = request.nextUrl.searchParams.get('filter');
    const targetUrl = filter 
      ? `${subscription.data.subscribe_url}&filter=${filter}`
      : subscription.data.subscribe_url;

    const response = await fetch(targetUrl);
    const data = await response.text();

    return new Response(data, {
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Subscription proxy error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
