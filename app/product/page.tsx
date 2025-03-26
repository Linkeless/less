import { Suspense } from 'react'
import { getProducts, getUserInfo } from '@/lib/actions'
import ProductList from './ProductList'

export default async function ProductPage() {
  const [productsResponse, userResponse] = await Promise.all([
    getProducts(),
    getUserInfo().catch(() => null)
  ]);

  return (
    <Suspense fallback={
      <div className="min-h-[100dvh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    }>
      <ProductList 
        initialProducts={productsResponse.data} 
        initialUser={userResponse?.data || null}
      />
    </Suspense>
  )
}
