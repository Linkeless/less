'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Menu, MenuButton, MenuItem, MenuItems, Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react'
import { Bars3Icon, BellIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import md5 from 'md5'
import type { PurchasePlan, UserInfo } from '@/lib/types'
import { useLanguage } from '@/lib/i18n/hooks';
import TitleBar from '@/components/TitleBar'

interface ProductListProps {
  initialProducts: PurchasePlan[]
  initialUser: UserInfo | null
}

const LanguageSwitch = () => {
  const { language, setLanguage } = useLanguage();
  
  return (
    <Menu as="div" className="relative ml-3">
      <MenuButton className="relative flex items-center rounded-full bg-white p-1 text-gray-400 hover:text-gray-500">
        <span className="text-sm font-medium">{language === 'zh-CN' ? '中文' : 'EN'}</span>
      </MenuButton>
      <MenuItems className="absolute right-0 z-10 mt-2 w-32 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5">
        <MenuItem>
          <button
            onClick={() => setLanguage('en')}
            className={`block w-full px-4 py-2 text-sm text-left ${language === 'en' ? 'bg-gray-100' : ''}`}
          >
            English
          </button>
        </MenuItem>
        <MenuItem>
          <button
            onClick={() => setLanguage('zh-CN')}
            className={`block w-full px-4 py-2 text-sm text-left ${language === 'zh-CN' ? 'bg-gray-100' : ''}`}
          >
            中文
          </button>
        </MenuItem>
      </MenuItems>
    </Menu>
  );
};

export default function ProductList({ initialProducts, initialUser }: ProductListProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const [periodType, setPeriodType] = useState<'monthly' | 'yearly'>('monthly')
  const [showAuthModal, setShowAuthModal] = useState(!initialUser)
  
  const filteredPlans = initialProducts.filter(plan => {
    if (periodType === 'monthly') {
      return plan.month_price !== null;
    } else {
      return plan.year_price !== null && plan.month_price === null;
    }
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
        className="mt-4 [&_.t4]:mb-4 [&_.tit]:font-medium [&_.tit]:text-gray-900 [&_.desc]:mt-2 [&_.desc]:text-gray-600 [&_i.gou]:mr-2 [&_i.gou]:inline-block [&_i.gou]:h-4 [&_i.gou]:w-4 [&_i.gou]:rounded-full [&_i.gou]:bg-blue-50 [&_i.gou]:text-blue-500 [&_i.gou:before]:content-['✓']" 
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
    { 
      name: t.common.signOut, 
      onClick: () => {
        localStorage.clear();
        router.push('/login');
      }
    },
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
        <div className="fixed inset-0 bg-white"></div>
        <div className="relative min-h-[100dvh] flex flex-col">
          <nav className="bg-white border-b border-gray-200 flex-none">
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

          <main className="flex-1 bg-gray-50 flex items-center justify-center">
            <div className="relative w-full max-w-md mx-4">
              <div className="relative rounded-lg bg-white p-4 shadow-lg">
                <div className="flex items-start space-x-4">
                  <div className="shrink-0">
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                  </div>
                  <div className="flex-1 md:flex md:justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">{t.product.auth.required}</h3>
                      <p className="mt-1 text-sm text-gray-500">{t.product.auth.pleaseLogin}</p>
                    </div>
                    <div className="mt-4 flex md:ml-6 md:mt-0">
                      <button
                        type="button"
                        onClick={() => window.location.href = '/login'}
                        className="text-sm font-medium text-yellow-600 hover:text-yellow-500"
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

  return (
    <div className="min-h-[100dvh] flex flex-col">
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
      
      <main className="flex-1 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-base font-semibold leading-7 text-indigo-600">{t.product.title}</h1>
            <div className="mt-8 flex justify-center">
              <div className="relative rounded-full p-0.5 bg-gray-200">
                <button
                  onClick={() => setPeriodType('monthly')}
                  className={classNames(
                    periodType === 'monthly' ? 'bg-white shadow' : '',
                    'px-4 py-2 rounded-full text-sm font-semibold'
                  )}
                >
                  {t.product.billing.monthly}
                </button>
                <button
                  onClick={() => setPeriodType('yearly')}
                  className={classNames(
                    periodType === 'yearly' ? 'bg-white shadow' : '',
                    'px-4 py-2 rounded-full text-sm font-semibold'
                  )}
                >
                  {t.product.billing.annual}
                </button>
              </div>
            </div>
          </div>

          <div className="mx-auto mt-16 grid max-w-lg gap-8 lg:max-w-none lg:grid-cols-3">
            {filteredPlans.map((plan) => (
              <div
                key={plan.id}
                className="rounded-3xl p-8 ring-1 ring-gray-200 xl:p-10"
              >
                <h3 className="text-lg font-semibold leading-8 text-gray-900">
                  {plan.name}
                </h3>
                <p className="mt-6 flex items-baseline gap-x-1 text-gray-900">
                  <span className="text-4xl font-bold">
                    ¥{periodType === 'monthly' ? 
                      (plan.month_price ? plan.month_price / 100 : 0) : 
                      (plan.year_price ? plan.year_price / 100 : 0)
                    }
                  </span>
                  <span className="text-sm font-semibold text-gray-400">
                    /{periodType === 'monthly' ? 'month' : 'year'}
                  </span>
                </p>
                <Content html={plan.content} />
                {periodType === 'monthly' && plan.month_price && (
                  <div className="flex justify-between text-gray-600">
                    <span>{t.product.price.monthlyPrice}:</span>
                    <span className="font-medium">¥{plan.month_price / 100}{t.product.billing.perMonth}</span>
                  </div>
                )}
                {periodType === 'yearly' && plan.year_price && (
                  <div className="flex justify-between text-gray-600">
                    <span>{t.product.price.yearlyPrice}:</span>
                    <span className="font-medium">¥{plan.year_price / 100}{t.product.billing.perYear}</span>
                  </div>
                )}
                <a
                  href={`/product/order?id=${plan.id}`}
                  className="mt-6 block rounded-md px-3 py-2 text-center text-sm font-semibold leading-6 bg-white text-indigo-600 ring-1 ring-inset ring-indigo-200 hover:ring-indigo-300"
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