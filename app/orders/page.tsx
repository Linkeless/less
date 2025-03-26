import { Suspense } from 'react'
import TitleBar from '@/components/TitleBar'
import OrdersTable from './OrdersTable'
import { getUserInfo } from '@/lib/actions'
import md5 from 'md5'
import SignOutButton from '@/components/SignOutButton'
import type { UserInfo } from '@/lib/types'

export default async function OrdersPage() {
  const userInfo = await getUserInfo();
  
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', current: false },
    { name: 'Product', href: '/product', current: false },
    { name: 'Orders', href: '/orders', current: true },
  ]

  const user = {
    name: userInfo.data.email.split('@')[0],
    email: userInfo.data.email,
    imageUrl: `https://www.gravatar.com/avatar/${md5(userInfo.data.email.trim().toLowerCase())}?s=256&d=monsterid`,
  }

  const userNavigation = [
    { name: 'Sign out', component: <SignOutButton /> }
  ]

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <TitleBar user={user} navigation={navigation} userNavigation={userNavigation} />
      <div className="flex-1 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl">
            <div className="border-b border-gray-200 px-4 py-5 sm:px-6">
              <h3 className="text-base font-semibold leading-6 text-gray-900">Order History</h3>
            </div>
            <Suspense fallback={<div className="p-4 text-center">Loading orders...</div>}>
              <OrdersTable />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}
