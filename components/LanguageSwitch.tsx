'use client';

import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { useLanguage } from '@/lib/i18n/hooks'; // Assuming this path is correct

export default function LanguageSwitch() {
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
} 