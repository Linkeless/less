'use client';

import { Dialog as HeadlessDialog, Transition as HeadlessTransition } from '@headlessui/react';
import type { TranslationValues } from '@/lib/i18n/context';
import { Fragment } from 'react';

interface Notice {
  id: number | string;
  content: string;
  title?: string;
  tags?: string[];
}

interface NoticesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  notices: Notice[];
  t: TranslationValues; 
}

export default function NoticesDialog({
  isOpen,
  onClose,
  notices,
  t
}: NoticesDialogProps) {
  return (
    <HeadlessTransition appear show={isOpen} as={Fragment}>
      <HeadlessDialog as="div" className="relative z-50" onClose={onClose}>
        <HeadlessTransition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" />
        </HeadlessTransition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <HeadlessTransition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <HeadlessDialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                <HeadlessDialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100 mb-4">
                  {/* Use t.common.notifications or a direct string if not translated yet */}
                  {t.common.notifications || '通知'} 
                </HeadlessDialog.Title>
                {notices.length === 0 ? (
                  <div className="text-gray-500 dark:text-gray-400 text-center py-8">
                    {/* TODO: Add t.common.noNotificationsAvailable to translation files */}
                    {/* {t.common.noNotificationsAvailable || '暂无通知'} */}
                    暂无通知
                    </div>
                ) : (
                  <ul className="space-y-3 max-h-80 overflow-y-auto pr-2">
                    {notices.map((notice) => (
                      <li key={notice.id} className="bg-yellow-50 dark:bg-yellow-900/60 border border-yellow-200 dark:border-yellow-700 rounded px-4 py-2 text-sm text-yellow-800 dark:text-yellow-100 font-medium">
                        {notice.content}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-6 flex justify-end">
                  <button
                    className="inline-flex justify-center rounded-md border border-transparent bg-indigo-100 dark:bg-indigo-900 px-4 py-2 text-sm font-medium text-indigo-900 dark:text-indigo-100 hover:bg-indigo-200 dark:hover:bg-indigo-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                    onClick={onClose}
                  >
                    {/* TODO: Add t.common.closeBtn to translation files */}
                    {/* {t.common.closeBtn || '关闭'} */}
                    关闭
                  </button>
                </div>
              </HeadlessDialog.Panel>
            </HeadlessTransition.Child>
          </div>
        </div>
      </HeadlessDialog>
    </HeadlessTransition>
  );
} 