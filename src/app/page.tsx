'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogPanel, Transition, Popover } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { Fragment } from 'react'
import { useRouter } from 'next/navigation'
import ThemeToggle from '@/components/ui/theme-toggle'
import TypewriterEffect from '@/components/ui/typewriter-effect'
import { checkAuthStatus } from '@/lib/auth-client'

const navigation = [
  { name: 'Product', href: 'product' },
  { name: 'Features', href: '404' },
  { name: 'Marketplace', href: '404' },
  { name: 'Company', href: '404' },
]

export default function Example() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // 检查用户是否已登录
    const checkLoginStatus = async () => {
      try {
        // 检查客户端认证状态
        const { isLoggedIn } = await checkAuthStatus()
        setIsLoggedIn(isLoggedIn)
      } catch (error) {
        console.error('检查登录状态失败:', error)
        setIsLoggedIn(false)
      }
    }

    checkLoginStatus()
  }, [])

  const handleGetStarted = (e: React.MouseEvent) => {
    e.preventDefault()
    if (isLoggedIn) {
      router.push('/dashboard')
    } else {
      router.push('/login')
    }
  }

  return (
    <div className="bg-white dark:bg-gray-900">
      <header className="absolute inset-x-0 top-0 z-50">
        <nav aria-label="Global" className="flex items-center justify-between p-6 lg:px-8">
          <div className="flex lg:flex-1">
            <a href="/" className="-m-1.5 p-1.5">
              <span className="sr-only">Linkeless</span>
              <img
                alt="Linkeless"
                src="/Linkeless.png"
                className="h-8 w-auto dark:invert"
              />
            </a>
          </div>
          <div className="flex lg:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <span className="sr-only">Open main menu</span>
              <Bars3Icon aria-hidden="true" className="size-6" />
            </button>
          </div>
          <div className="hidden lg:flex lg:gap-x-12">
            {navigation.slice(0, 2).map((item) => (
              <a key={item.name} href={item.href} className="text-sm/6 font-semibold text-gray-900 dark:text-gray-100 hover:text-gray-600 dark:hover:text-gray-300">
                {item.name}
              </a>
            ))}

            <a href="404" className="text-sm/6 font-semibold text-gray-900 dark:text-gray-100 hover:text-gray-600 dark:hover:text-gray-300">
              Company
            </a>

            <Popover className="relative">
              <Popover.Button className="inline-flex items-center gap-x-1 text-sm/6 font-semibold text-gray-900 dark:text-gray-100 hover:text-gray-600 dark:hover:text-gray-300">
                Resources
              </Popover.Button>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-200"
                enterFrom="opacity-0 translate-y-1"
                enterTo="opacity-100 translate-y-0"
                leave="transition ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-1"
              >
                <Popover.Panel className="absolute left-1/2 z-10 mt-3 w-screen max-w-xs -translate-x-1/2 transform px-2 sm:px-0">
                  <div className="overflow-hidden rounded-lg shadow-lg ring-1 ring-black/5 dark:ring-white/5">
                    <div className="relative grid gap-6 bg-white dark:bg-gray-800 p-6">
                      <a href="#" className="flex items-center rounded-lg p-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <div className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-100">Documentation</div>
                      </a>
                      <a href="#" className="flex items-center rounded-lg p-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <div className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-100">API Reference</div>
                      </a>
                    </div>
                  </div>
                </Popover.Panel>
              </Transition>
            </Popover>
          </div>
          <div className="hidden lg:flex lg:flex-1 lg:justify-end items-center gap-4">
            <ThemeToggle />
            <a 
              href={isLoggedIn ? "/dashboard" : "/login"} 
              className="text-sm/6 font-semibold text-gray-900 dark:text-gray-100 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
            >
              {isLoggedIn ? 'Dashboard' : 'Log in'} <span aria-hidden="true">&rarr;</span>
            </a>
          </div>
        </nav>

        <Transition show={mobileMenuOpen} as={Fragment}>
          <Dialog onClose={setMobileMenuOpen} className="lg:hidden">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 z-50 bg-gray-500 bg-opacity-75 transition-opacity" />
            </Transition.Child>

            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white dark:bg-gray-900 px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10 dark:sm:ring-gray-100/10">
                <div className="flex items-center justify-between">
                  <a href="/" className="-m-1.5 p-1.5">
                    <span className="sr-only">Linkeless</span>
                    <img
                      alt="Linkeless"
                      src="/Linkeless.png"
                      className="h-8 w-auto dark:invert"
                    />
                  </a>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="-m-2.5 rounded-md p-2.5 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <span className="sr-only">Close menu</span>
                    <XMarkIcon aria-hidden="true" className="size-6" />
                  </button>
                </div>
                <div className="mt-6 flow-root">
                  <div className="-my-6 divide-y divide-gray-500/10 dark:divide-gray-500/50">
                    <div className="space-y-2 py-6">
                      {navigation.map((item) => (
                        <a
                          key={item.name}
                          href={item.href}
                          className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          {item.name}
                        </a>
                      ))}
                      <a href="#" className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        Resources
                      </a>
                    </div>
                    <div className="py-6">
                      <a
                        href={isLoggedIn ? "/dashboard" : "/login"}
                        className="-mx-3 block rounded-lg px-3 py-2.5 text-base/7 font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        {isLoggedIn ? 'Dashboard' : 'Log in'}
                      </a>
                    </div>
                  </div>
                </div>
              </DialogPanel>
            </Transition.Child>
          </Dialog>
        </Transition>
      </header>

      <div className="relative isolate min-h-screen px-6 pt-14 lg:px-8">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
        >
          <div
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
            className="relative left-[calc(50%-11rem)] aspect-1155/678 w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
          />
        </div>
        <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
          <div className="hidden sm:mb-8 sm:flex sm:justify-center">
            {/* Empty div for layout */}
          </div>
          <div className="text-center">
            <h1 className="text-5xl font-semibold tracking-tight text-balance text-gray-900 dark:text-gray-100 sm:text-7xl">
              Linkeless
            </h1>
            <p className="mt-8 text-lg font-medium text-pretty text-gray-500 dark:text-gray-400 sm:text-xl/8">
              <TypewriterEffect 
                text="Link is less, Linkeless."
                speed={100}
                showCursor={true}
                cursorClassName="text-gray-500 dark:text-gray-400"
              />
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <button
                onClick={handleGetStarted}
                className="rounded-md bg-indigo-600 dark:bg-indigo-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 dark:hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:focus-visible:outline-indigo-500 transition-colors duration-200"
              >
                {isLoggedIn ? 'Go to Dashboard' : 'Get started'}
              </button>
              <a href="/login" className="text-sm/6 font-semibold text-gray-900 dark:text-gray-100 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200">
                Learn more <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
