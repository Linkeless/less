import { Suspense } from 'react'
import { getProductById, getUserInfo } from '@/lib/actions'
import { notFound } from 'next/navigation'
import OrderForm from './OrderForm'

type SearchParams = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

async function getSearchParam(params: SearchParams['searchParams'], key: string): Promise<string | undefined> {
  const resolvedParams = await params;
  const value = resolvedParams[key];
  return typeof value === 'string' ? value : undefined;
}

async function getData(params: SearchParams['searchParams']) {
  if (!params) return null;
  const id = await getSearchParam(params, 'id');
  const couponValue = await getSearchParam(params, 'couponValue');
  if (!id) return null;

  try {
    const [productResponse, userResponse] = await Promise.all([
      getProductById(id),
      getUserInfo()
    ]);

    if (!productResponse.data) {
      return null;
    }

    return {
      product: productResponse.data,
      user: userResponse?.data || null,  // Convert undefined to null
      couponValue: couponValue ? parseFloat(couponValue) : undefined
    };
  } catch (error) {
    return null;
  }
}

export default async function OrderPage({
  searchParams,
}: SearchParams) {
  const data = await getData(searchParams);

  if (!data) {
    return notFound();
  }
  return (
    <Suspense fallback={
      <div className="min-h-[100dvh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    }>
      <OrderForm 
        initialProduct={data.product}
        user={data.user}
        couponValue={data.couponValue}
      />
    </Suspense>
  )
}
