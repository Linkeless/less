'use client'

import { Suspense, useState, useEffect } from 'react'
import TitleBar from '@/components/layout/title-bar'
import OrdersTable from './OrdersTable'
import { getUserInfo } from '@/lib/actions'
import md5 from 'md5'
import SignOutButton from '@/components/auth/sign-out-button'
import type { UserInfo } from '@/lib/types'
import { useLanguage } from '@/lib/i18n/hooks'

// Add global styles - 添加全局样式
const globalStyles = `
  ::-webkit-scrollbar {
    display: none;
  }
  * {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

export default function OrdersPage() {
  const { t } = useLanguage()
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)

  useEffect(() => {
    const loadUserInfo = async () => {
      const response = await getUserInfo()
      if (response.status === 'success') {
        setUserInfo(response.data)
      }
    }
    loadUserInfo()
  }, [])
  
  const navigation = [
    { name: t.common.dashboard, href: '/dashboard', current: false },
    { name: t.common.product, href: '/product', current: false },
    { name: t.common.orders, href: '/orders', current: true },
    { name: t.invite.title, href: '/invite', current: false },
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
    <>
      <style jsx global>{globalStyles}</style>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 relative">
        {/* Grid Background */}
        <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]" style={{
          backgroundImage: `
            linear-gradient(rgb(0, 0, 0) 1px, transparent 1px),
            linear-gradient(90deg, rgb(0, 0, 0) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }}></div>
        <div className="relative z-10">
          <TitleBar 
            user={user} 
            navigation={navigation} 
            userNavigation={userNavigation}
            showLanguageSwitch={true}  
          />
          
          <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
            <div className="space-y-8 sm:space-y-16">
              <div>
                <div className="mb-6 sm:mb-8 border-b border-gray-200 dark:border-gray-700 pb-4 sm:pb-5">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white leading-tight">{t.orders.history}</h3>
                  <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">查看您的订单历史记录</p>
                </div>
                <div className="bg-white dark:bg-gray-800 shadow-sm ring-1 ring-gray-900/5 dark:ring-gray-700/50 rounded-xl">
                  <Suspense fallback={
                    <div className="p-4 text-center text-gray-600 dark:text-gray-400">{t.common.loading}</div>
                  }>
                    <OrdersTable />
                  </Suspense>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  )
}
