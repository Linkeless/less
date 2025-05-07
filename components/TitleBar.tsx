'use client'

import { Disclosure, DisclosureButton, DisclosurePanel, Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { Bars3Icon, BellIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useLanguage } from '@/lib/i18n/hooks';
import { useRouter } from 'next/navigation'
import { handleLogout } from '@/lib/authUtils';
import { useState } from 'react';
import LanguageSwitch from './LanguageSwitch';

interface TitleBarProps {
  user: {
    name: string;
    email: string;
    imageUrl: string;
  };
  navigation: Array<{
    name: string;
    href: string;
    current: boolean;
  }>;
  userNavigation: Array<{
    name: string;
    onClick?: () => void;
    component?: React.ReactNode;
  }>;
  showLanguageSwitch?: boolean;
  rightExtra?: React.ReactNode;
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function TitleBar({ user, navigation, userNavigation, showLanguageSwitch, rightExtra }: TitleBarProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const handleNavigation = (href: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (href === '#') return;

    if (href === '/logout') {
      handleLogout();
      return;
    }
    
    if (href === '/login') {
      router.push(href);
      return;
    }

    router.push(href);
    setIsOpen(false);
  };

  return (
    <Disclosure as="nav" className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <div className="shrink-0">
              <a href="/" onClick={(e) => handleNavigation('/', e)} className="flex items-center">
                <img
                  alt="Linkeless"
                  src="/Linkeless.png"
                  className="size-8 dark:invert"
                />
                <span className="ml-2 text-lg font-semibold text-gray-900 dark:text-white">Linkeless</span>
              </a>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {navigation.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    onClick={(e) => handleNavigation(item.href, e)}
                    className={classNames(
                      item.current 
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100' 
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100',
                      'rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200'
                    )}
                  >
                    {item.name}
                  </a>
                ))}
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="ml-4 flex items-center gap-4">
              {showLanguageSwitch && <LanguageSwitch />}
              {rightExtra}
              <Menu as="div" className="relative">
                <MenuButton className="flex items-center gap-2 rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200">
                  {user.imageUrl ? (
                    <img 
                      alt="" 
                      src={user.imageUrl}
                      className="size-8 rounded-full" 
                    />
                  ) : null}
                  <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-200">{user.name}</span>
                </MenuButton>
                <MenuItems className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-lg bg-white dark:bg-gray-800 py-1 shadow-lg ring-1 ring-black/5 dark:ring-white/5 focus:outline-none">
                  {userNavigation.map((item) => (
                    <MenuItem key={item.name}>
                      {item.component || (
                        <button
                          onClick={item.onClick}
                          className="block w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                        >
                          {item.name}
                        </button>
                      )}
                    </MenuItem>
                  ))}
                </MenuItems>
              </Menu>
            </div>
          </div>
          <div className="flex md:hidden">
            <DisclosureButton 
              className="relative p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 rounded-md transition-colors duration-200"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? (
                <XMarkIcon className="size-6" />
              ) : (
                <Bars3Icon className="size-6" />
              )}
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
              onClick={(e) => handleNavigation(item.href, e)}
              className={classNames(
                item.current 
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-white',
                'block rounded-md px-3 py-2 text-base font-medium transition-colors duration-200'
              )}
            >
              {item.name}
            </DisclosureButton>
          ))}
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700 pb-3 pt-4">
          <div className="flex items-center px-5">
            <div className="shrink-0">
              {user.imageUrl ? (
                <img
                  alt=""
                  src={user.imageUrl}
                  className="size-10 rounded-full"
                />
              ) : null}
            </div>
            <div className="ml-3">
              <div className="text-base font-medium text-gray-800 dark:text-gray-200">{user.name}</div>
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{user.email}</div>
            </div>
          </div>
          <div className="mt-3 space-y-1 px-2">
            {userNavigation.map((item) => (
              <DisclosureButton
                key={item.name}
                as="div"
                className="w-full"
              >
                {item.component || (
                  <button
                    onClick={item.onClick}
                    className="block w-full rounded-md px-3 py-2 text-base font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-white text-left transition-colors duration-200"
                  >
                    {item.name}
                  </button>
                )}
              </DisclosureButton>
            ))}
          </div>
        </div>
      </DisclosurePanel>
    </Disclosure>
  );
}
