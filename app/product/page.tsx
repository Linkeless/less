'use client'

import { useState, useEffect } from 'react'
import { fetchPlans, fetchUserInfo, type PurchasePlan, type UserInfo } from '@/lib/api'
import { Menu, MenuButton, MenuItem, MenuItems, Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react'
import { Bars3Icon, BellIcon, XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import md5 from 'md5'

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
  { name: 'Dashboard', href: '/dashboard', current: false },
  { name: 'Product', href: '/product', current: true },
  { name: 'Orders', href: '/orders', current: false },  
]

const userNavigation = [
  { 
    name: 'Sign out', 
    onClick: () => {
      localStorage.clear();
      window.location.href = '/login';
    }
  },
]

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
                    <h3 className="text-sm font-medium text-gray-900">Authentication required</h3>
                    <p className="mt-1 text-sm text-gray-500">Please login to access this page</p>
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

export default function Example() {
  const [plans, setPlans] = useState<PurchasePlan[]>([])
  const [periodType, setPeriodType] = useState<'monthly' | 'yearly'>('monthly')
  const [userInfo, setUserInfo] = useState<UserInfo['data'] | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)

  useEffect(() => {
    const authData = localStorage.getItem('auth_data')
    if (!authData) {
      setShowAuthModal(true)
      return
    }

    const getPlans = async () => {
      try {
        const response = await fetchPlans()
        if (response.status === 'success') {
          setPlans(response.data.filter(plan => plan.show === 1).sort((a, b) => a.sort - b.sort))
        }
      } catch (error: any) {
        console.error('Failed to fetch plans:', error)
        if (error.response?.status === 401) {
          setShowAuthModal(true)
        }
      }
    }
    
    const fetchUserData = async () => {
      try {
        const response = await fetchUserInfo()
        if (response.status === 'success') {
          setUserInfo(response.data)
        }
      } catch (error: any) {
        console.error('Failed to fetch user info:', error)
        if (error.response?.status === 401) {
          setShowAuthModal(true)
        }
      }
    }

    getPlans()
    fetchUserData()
  }, [])

  const filteredPlans = plans.filter(plan => {
    if (periodType === 'monthly') {
      return plan.month_price !== null;
    } else {
      // For yearly, only show plans that have year_price but no month_price
      return plan.year_price !== null && plan.month_price === null;
    }
  });

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
      <Disclosure as="nav" className="bg-white border-b border-gray-200 flex-none">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <div className="shrink-0">
                <a href="/">
                  <img
                    alt="Linkeless"
                    src="/Linkeless.png"
                    className="size-8"
                  />
                </a>
              </div>
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  {navigation.map((item) => (
                    <a
                      key={item.name}
                      href={item.href}
                      className={classNames(
                        item.current ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900',
                        'rounded-md px-3 py-2 text-sm font-medium'
                      )}
                    >
                      {item.name}
                    </a>
                  ))}
                </div>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="ml-4 flex items-center md:ml-6">
                <button className="relative rounded-full bg-white p-1 text-gray-400 hover:text-gray-500">
                  <BellIcon className="size-6" />
                </button>
                <Menu as="div" className="relative ml-3">
                  <MenuButton className="relative flex rounded-full bg-white text-sm">
                    <img 
                      alt="" 
                      src={userInfo ? getGravatarUrl(userInfo.email) : '/default-avatar.png'} 
                      className="size-8 rounded-full" 
                    />
                  </MenuButton>
                  <MenuItems className="absolute right-0 z-10 mt-2 w-48 rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5">
                    {userNavigation.map((item) => (
                      <MenuItem key={item.name}>
                        <button
                          onClick={item.onClick}
                          className="block w-full px-4 py-2 text-sm text-gray-700 text-left"
                        >
                          {item.name}
                        </button>
                      </MenuItem>
                    ))}
                  </MenuItems>
                </Menu>
              </div>
            </div>
            <div className="-mr-2 flex md:hidden">
              <DisclosureButton className="relative p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500">
                <Bars3Icon className="size-6" />
              </DisclosureButton>
            </div>
          </div>
        </div>

        <DisclosurePanel className="md:hidden">
          <div className="space-y-1 px-2 pb-3 pt-2">
            {navigation.map((item) => (
              <DisclosureButton
                key={item.name}
                as="a"
                href={item.href}
                className={classNames(
                  item.current ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900',
                  'block rounded-md px-3 py-2 text-base font-medium'
                )}
              >
                {item.name}
              </DisclosureButton>
            ))}
          </div>
        </DisclosurePanel>
      </Disclosure>

      <main className="flex-1 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-base font-semibold leading-7 text-indigo-600">Product List</h1>
            <div className="mt-8 flex justify-center">
              <div className="relative rounded-full p-0.5 bg-gray-200">
                <button
                  onClick={() => setPeriodType('monthly')}
                  className={classNames(
                    periodType === 'monthly' ? 'bg-white shadow' : '',
                    'px-4 py-2 rounded-full text-sm font-semibold'
                  )}
                >
                  Monthly billing
                </button>
                <button
                  onClick={() => setPeriodType('yearly')}
                  className={classNames(
                    periodType === 'yearly' ? 'bg-white shadow' : '',
                    'px-4 py-2 rounded-full text-sm font-semibold'
                  )}
                >
                  Annual billing
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
                <a
                  href={`/product/order?id=${plan.id}`}
                  className="mt-6 block rounded-md px-3 py-2 text-center text-sm font-semibold leading-6 bg-white text-indigo-600 ring-1 ring-inset ring-indigo-200 hover:ring-indigo-300"
                >
                  Order Now
                </a>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
