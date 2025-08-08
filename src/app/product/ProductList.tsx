'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import md5 from 'md5'
import type { PurchasePlan, UserInfo } from '@/lib/types'
import { useLanguage } from '@/lib/i18n/hooks';
import TitleBar from '@/components/layout/title-bar'
import SignOutButton from '@/components/auth/sign-out-button'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

interface ProductListProps {
  initialProducts: PurchasePlan[]
  initialUser: UserInfo | null
  isLoading?: boolean
  error?: string | null
  onRetry?: () => void
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

export default function ProductList({ initialProducts, initialUser, isLoading = false, error = null, onRetry }: ProductListProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const [periodType, setPeriodType] = useState<'monthly' | 'yearly' | 'onetime'>('monthly')
  // 不在初始渲染时弹登录，保持与其它页面一致；仅在下单动作触发
  const [showAuthModal, setShowAuthModal] = useState(false)
  useEffect(() => {
    if (initialUser) setShowAuthModal(false)
  }, [initialUser])
  
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
        <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)} 
        />
        <TitleBar 
          user={user}
          userNavigation={userNavigation}
          showLanguageSwitch={true}
        />
        
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
          {/* 错误提示（不遮挡页面） */}
          {error && (
            <div className="mb-6">
              <Alert variant="destructive">
                <AlertTitle>加载失败</AlertTitle>
                <AlertDescription>
                  <div className="flex items-center justify-between gap-4">
                    <p className="truncate">{error}</p>
                    {onRetry && (
                      <Button onClick={onRetry} variant="outline" size="sm">重试</Button>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          )}

          {!isLoading && (
          <div className="space-y-8 sm:space-y-16">
              {/* 产品套餐 */}
              <div>
                <div className="mb-6 sm:mb-8 border-b border-gray-200 dark:border-gray-700 pb-4 sm:pb-5">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white leading-tight">{t.product.title}</h3>
                  <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">选择适合您的订阅套餐</p>
                </div>
                
                <div className="flex justify-center mb-8">
                  <div className="inline-flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1 gap-1">
                    {hasMonthlyPlans && (
                      <button
                        onClick={() => setPeriodType('monthly')}
                        className={classNames(
                          periodType === 'monthly' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100',
                          'px-4 py-2 rounded-md text-sm font-medium transition-all duration-200'
                        )}
                      >
                        {t.product.billing.monthly}
                      </button>
                    )}
                    {hasYearlyPlans && (
                      <button
                        onClick={() => setPeriodType('yearly')}
                        className={classNames(
                          periodType === 'yearly' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100',
                          'px-4 py-2 rounded-md text-sm font-medium transition-all duration-200'
                        )}
                      >
                        {t.product.billing.annual}
                      </button>
                    )}
                    {hasOnetimePlans && (
                      <button
                        onClick={() => setPeriodType('onetime')}
                        className={classNames(
                          periodType === 'onetime' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100',
                          'px-4 py-2 rounded-md text-sm font-medium transition-all duration-200'
                        )}
                      >
                        {t.product.billing.oneTime}
                      </button>
                    )}
                  </div>
                </div>

              <div className="mx-auto mt-16 grid max-w-lg gap-8 lg:max-w-none lg:grid-cols-3">
              {filteredPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="relative group"
                >
                  <div 
                    onClick={() => handleOrderClick(plan.id)}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 cursor-pointer hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-200"
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
                    <div className="mt-6 space-y-3">
                      {periodType === 'monthly' && plan.month_price && (
                        <div className="flex justify-between items-center py-2 px-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <span className="text-sm text-gray-600 dark:text-gray-400">{t.product.price.monthlyPrice}</span>
                          <span className="font-semibold text-gray-900 dark:text-gray-100">¥{plan.month_price / 100}{t.product.billing.perMonth}</span>
                        </div>
                      )}
                      {periodType === 'yearly' && plan.year_price && (
                        <div className="flex justify-between items-center py-2 px-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <span className="text-sm text-gray-600 dark:text-gray-400">{t.product.price.yearlyPrice}</span>
                          <span className="font-semibold text-gray-900 dark:text-gray-100">¥{plan.year_price / 100}{t.product.billing.perYear}</span>
                        </div>
                      )}
                      {periodType === 'onetime' && plan.onetime_price && (
                        <div className="flex justify-between items-center py-2 px-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <span className="text-sm text-gray-600 dark:text-gray-400">{t.product.price.oneTimePrice}</span>
                          <span className="font-semibold text-gray-900 dark:text-gray-100">¥{plan.onetime_price / 100}</span>
                        </div>
                      )}
                    </div>
                    {plan.onetime_price && (
                      <div className="mt-4">
                        <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 font-medium text-sm">
                          {t.product.order.unlimited}
                        </span>
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation(); // 阻止事件冒泡，避免触发卡片的点击事件
                        handleOrderClick(plan.id);
                      }}
                      className="mt-6 w-full rounded-lg px-4 py-2.5 text-center text-sm font-semibold bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-sm hover:from-indigo-500 hover:to-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all duration-200 min-h-[44px]"
                    >
                      {t.product.order.now}
                    </button>
                  </div>
                </div>
              ))}
              </div>
            </div>
            </div>
            )}
        </main>
      </div>
    </div>
  )
  }