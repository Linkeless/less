'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import md5 from 'md5'
import type { PurchasePlan, UserInfo } from '@/lib/types'
import { useLanguage } from '@/lib/i18n/hooks';
import TitleBar from '@/components/TitleBar'
import SignOutButton from '@/components/SignOutButton'

interface ProductListProps {
  initialProducts: PurchasePlan[]
  initialUser: UserInfo | null
}

// 此组件可由TitleBar内部使用，通过showLanguageSwitch标志控制
const LanguageSwitch = () => {
  const { language, setLanguage } = useLanguage();
  
  return (
    <Menu as="div" className="relative ml-3">
      <MenuButton className="relative flex items-center rounded-full bg-white dark:bg-gray-800 p-1 text-gray-400 dark:text-gray-300 hover:text-gray-500 dark:hover:text-gray-200">
        <span className="text-sm font-medium">{language === 'zh-CN' ? '中文' : 'EN'}</span>
      </MenuButton>
      <MenuItems className="absolute right-0 z-10 mt-2 w-32 origin-top-right rounded-md bg-white dark:bg-gray-800 py-1 shadow-lg ring-1 ring-black/5 dark:ring-white/10">
        <MenuItem>
          {({ active }) => (
            <button
              onClick={() => setLanguage('en')}
              className={`block w-full px-4 py-2 text-sm text-left text-gray-900 dark:text-gray-100 ${language === 'en' ? 'bg-gray-100 dark:bg-gray-700' : ''} ${active ? 'bg-gray-50 dark:bg-gray-700/70' : ''}`}
            >
              English
            </button>
          )}
        </MenuItem>
        <MenuItem>
          {({ active }) => (
            <button
              onClick={() => setLanguage('zh-CN')}
              className={`block w-full px-4 py-2 text-sm text-left text-gray-900 dark:text-gray-100 ${language === 'zh-CN' ? 'bg-gray-100 dark:bg-gray-700' : ''} ${active ? 'bg-gray-50 dark:bg-gray-700/70' : ''}`}
            >
              中文
            </button>
          )}
        </MenuItem>
      </MenuItems>
    </Menu>
  );
};

export default function ProductList({ initialProducts, initialUser }: ProductListProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const [periodType, setPeriodType] = useState<'monthly' | 'yearly' | 'onetime'>('monthly')
  const [showAuthModal, setShowAuthModal] = useState(!initialUser)
  
  // 检查是否有一次性套餐可用
  const hasMonthlyPlans = initialProducts.some(plan => plan.month_price !== null && plan.show === 1);
  const hasYearlyPlans = initialProducts.some(plan => plan.year_price !== null && plan.show === 1);
  const hasOnetimePlans = initialProducts.some(plan => plan.onetime_price !== null && plan.show === 1);
  
  // 如果没有月付套餐但有年付或一次性套餐，则默认显示年付或一次性套餐
  useEffect(() => {
    if (!hasMonthlyPlans) {
      if (hasYearlyPlans) {
        setPeriodType('yearly');
      } else if (hasOnetimePlans) {
        setPeriodType('onetime');
      }
    }
  }, [hasMonthlyPlans, hasYearlyPlans, hasOnetimePlans]);

  const filteredPlans = initialProducts.filter(plan => {
    if (periodType === 'monthly') {
      return plan.month_price !== null;
    } else if (periodType === 'yearly') {
      return plan.year_price !== null && plan.month_price === null;
    } else if (periodType === 'onetime') {
      return plan.onetime_price !== null;
    }
    return false;
  }).filter(plan => plan.show === 1)
    .sort((a, b) => a.sort - b.sort);

  const getGravatarUrl = (email: string) => {
    const hash = md5(email.trim().toLowerCase());
    return `https://www.gravatar.com/avatar/${hash}?s=256&d=monsterid`;
  };

  function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ')
  }

  interface ContentProps {
    html: string;
  }

  function Content({ html }: ContentProps) {
    return (
      <div 
        className="mt-4 [&_.t4]:mb-4 [&_.tit]:font-medium [&_.tit]:text-gray-900 dark:[&_.tit]:text-gray-100 [&_.desc]:mt-2 [&_.desc]:text-gray-600 dark:[&_.desc]:text-gray-400 [&_i.gou]:mr-2 [&_i.gou]:inline-block [&_i.gou]:h-4 [&_i.gou]:w-4 [&_i.gou]:rounded-full [&_i.gou]:bg-blue-50 dark:[&_i.gou]:bg-blue-900/50 [&_i.gou]:text-blue-500 dark:[&_i.gou]:text-blue-300 [&_i.gou:before]:content-['✓']" 
        dangerouslySetInnerHTML={{ __html: html }} 
      />
    );
  }

  const navigation = [
    { name: t.common.dashboard, href: '/dashboard', current: false },
    { name: t.common.product, href: '/product', current: true },
    { name: t.common.orders, href: '/orders', current: false },  
  ]

  const userNavigation = [
    { name: t.common.signOut, component: <SignOutButton /> }
  ]

  const user = {
    name: initialUser ? initialUser.email.split('@')[0] : 'User',
    email: initialUser ? initialUser.email : '',
    imageUrl: initialUser ? getGravatarUrl(initialUser.email) : '/default-avatar.png',
  }

  function AuthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    if (!isOpen) return null;
    
    return (
      <div className="fixed inset-0 z-50">
        <div className="fixed inset-0 bg-white dark:bg-gray-900"></div>
        <div className="relative min-h-[100dvh] flex flex-col">
          <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-none">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex h-16 items-center">
                <div className="shrink-0">
                  <img
                    alt="Linkeless"
                    src="/Linkeless.png"
                    className="size-8"
                  />
                </div>
              </div>
            </div>
          </nav>

          <main className="flex-1 bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
            <div className="relative w-full max-w-md mx-4">
              <div className="relative rounded-lg bg-white dark:bg-gray-800 p-4 shadow-lg">
                <div className="flex items-start space-x-4">
                  <div className="shrink-0">
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 dark:text-yellow-300" aria-hidden="true" />
                  </div>
                  <div className="flex-1 md:flex md:justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">{t.product.auth.required}</h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t.product.auth.pleaseLogin}</p>
                    </div>
                    <div className="mt-4 flex md:ml-6 md:mt-0">
                      <button
                        type="button"
                        onClick={() => router.push('/login')}
                        className="text-sm font-medium text-yellow-600 dark:text-yellow-400 hover:text-yellow-500 dark:hover:text-yellow-300"
                      >
                        Login
                        <span aria-hidden="true"> &rarr;</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const handleOrderClick = (planId: number) => {
    if (!initialUser) {
      setShowAuthModal(true);
      return;
    }
    router.push(`/product/order?id=${planId}`);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col dark:bg-gray-900 dark:text-gray-100">
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
      <TitleBar 
        user={user}
        navigation={navigation}
        userNavigation={userNavigation}
        showLanguageSwitch={true}
      />
      
      <main className="flex-1 bg-gray-50 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-base font-semibold leading-7 text-indigo-600 dark:text-indigo-400">{t.product.title}</h1>
            <div className="mt-8 flex justify-center">
              <div className="relative rounded-full p-0.5 bg-gray-200 dark:bg-gray-700">
                {hasMonthlyPlans && (
                  <button
                    onClick={() => setPeriodType('monthly')}
                    className={classNames(
                      periodType === 'monthly' ? 'bg-white dark:bg-gray-800 shadow' : '',
                      'px-4 py-2 rounded-full text-sm font-semibold dark:text-gray-200'
                    )}
                  >
                    {t.product.billing.monthly}
                  </button>
                )}
                {hasYearlyPlans && (
                  <button
                    onClick={() => setPeriodType('yearly')}
                    className={classNames(
                      periodType === 'yearly' ? 'bg-white dark:bg-gray-800 shadow' : '',
                      'px-4 py-2 rounded-full text-sm font-semibold dark:text-gray-200'
                    )}
                  >
                    {t.product.billing.annual}
                  </button>
                )}
                {hasOnetimePlans && (
                  <button
                    onClick={() => setPeriodType('onetime')}
                    className={classNames(
                      periodType === 'onetime' ? 'bg-white dark:bg-gray-800 shadow' : '',
                      'px-4 py-2 rounded-full text-sm font-semibold dark:text-gray-200'
                    )}
                  >
                    {t.product.billing.oneTime}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="mx-auto mt-16 grid max-w-lg gap-8 lg:max-w-none lg:grid-cols-3">
            {filteredPlans.map((plan) => (
              <div
                key={plan.id}
                className="rounded-3xl p-8 ring-1 ring-gray-200 dark:ring-gray-700 dark:bg-gray-800 xl:p-10"
              >
                <h3 className="text-lg font-semibold leading-8 text-gray-900 dark:text-gray-100">
                  {plan.name}
                </h3>
                <p className="mt-6 flex items-baseline gap-x-1 text-gray-900 dark:text-gray-100">
                  <span className="text-4xl font-bold">
                    ¥{periodType === 'monthly' ? 
                      (plan.month_price ? plan.month_price / 100 : 0) : 
                      periodType === 'yearly' ?
                      (plan.year_price ? plan.year_price / 100 : 0) :
                      (plan.onetime_price ? plan.onetime_price / 100 : 0)
                    }
                  </span>
                  <span className="text-sm font-semibold text-gray-400 dark:text-gray-500">
                    {periodType === 'monthly' ? '/' + t.product.billing.monthly : 
                     periodType === 'yearly' ? '/' + t.product.billing.annual : 
                     '/' + t.product.billing.oneTime}
                  </span>
                </p>
                <Content html={plan.content} />
                {periodType === 'monthly' && plan.month_price && (
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>{t.product.price.monthlyPrice}:</span>
                    <span className="font-medium">¥{plan.month_price / 100}{t.product.billing.perMonth}</span>
                  </div>
                )}
                {periodType === 'yearly' && plan.year_price && (
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>{t.product.price.yearlyPrice}:</span>
                    <span className="font-medium">¥{plan.year_price / 100}{t.product.billing.perYear}</span>
                  </div>
                )}
                {periodType === 'onetime' && plan.onetime_price && (
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>{t.product.price.oneTimePrice}:</span>
                    <span className="font-medium">¥{plan.onetime_price / 100}</span>
                  </div>
                )}
                {plan.onetime_price && (
                  <div className="mt-2">
                    <span className="inline-flex items-center rounded-md bg-green-50 dark:bg-green-900 px-2 py-1 text-xs font-medium text-green-700 dark:text-green-300 ring-1 ring-inset ring-green-600/20">
                      {t.product.order.unlimited}
                    </span>
                  </div>
                )}
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleOrderClick(plan.id);
                  }}
                  className="mt-6 block rounded-md px-3 py-2 text-center text-sm font-semibold leading-6 bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 ring-1 ring-inset ring-indigo-200 dark:ring-indigo-500 hover:ring-indigo-300 dark:hover:ring-indigo-400"
                >
                  {t.product.order.now}
                </a>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}