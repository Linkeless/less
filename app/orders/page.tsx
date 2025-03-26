'use client'

import { Suspense, useState, useEffect } from 'react'
import TitleBar from '@/components/TitleBar'
import OrdersTable from './OrdersTable'
import { getUserInfo } from '@/lib/actions'
import md5 from 'md5'
import SignOutButton from '@/components/SignOutButton'
import type { UserInfo } from '@/lib/types'
import { useLanguage } from '@/lib/i18n/hooks';

export default function OrdersPage() {
  const { t } = useLanguage();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    const loadUserInfo = async () => {
      const response = await getUserInfo();
      if (response.status === 'success') {
        setUserInfo(response.data);
      }
    };
    loadUserInfo();
  }, []);
  
  const navigation = [
    { name: t.common.dashboard, href: '/dashboard', current: false },
    { name: t.common.product, href: '/product', current: false },
    { name: t.common.orders, href: '/orders', current: true },
  ]

  const user = {
    name: userInfo?.email.split('@')[0] || 'User',
    email: userInfo?.email || '',
    imageUrl: userInfo ? `https://www.gravatar.com/avatar/${md5(userInfo.email.trim().toLowerCase())}?s=256&d=monsterid` : '/default-avatar.png',
  }

  const userNavigation = [
    { name: t.common.signOut, component: <SignOutButton /> }
  ]

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <TitleBar 
        user={user} 
        navigation={navigation} 
        userNavigation={userNavigation}
        showLanguageSwitch={true}  
      />
      <div className="flex-1 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl">
            <div className="border-b border-gray-200 px-4 py-5 sm:px-6">
              <h3 className="text-base font-semibold leading-6 text-gray-900">{t.orders.history}</h3>
            </div>
            <Suspense fallback={
              <div className="p-4 text-center">{t.common.loading}</div>
            }>
              <OrdersTable />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}
