'use client';

import { Dialog as HeadlessDialog, Transition as HeadlessTransition } from '@headlessui/react';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import type { TranslationValues } from '@/lib/i18n/context';
import { Fragment } from 'react';

interface PopupNotice {
  id: number | string; // Or a more specific type if available
  title?: string;
  content: string;
  // Add other notice properties if needed
}

interface PopupNoticeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  notice: PopupNotice | null;
  t: TranslationValues; // For consistency, though not heavily used in current static text
}

export default function PopupNoticeDialog({
  isOpen,
  onClose,
  notice,
  t
}: PopupNoticeDialogProps) {
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
              <HeadlessDialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-0 text-left align-middle shadow-xl transition-all">
                <div className="flex items-start gap-4 p-4 sm:p-6">
                  <span className="flex-shrink-0 inline-flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900">
                    <ExclamationCircleIcon className="h-7 w-7 text-yellow-600 dark:text-yellow-300" aria-hidden="true" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <HeadlessDialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900 dark:text-gray-100">
                      {notice?.title || '通知'} {/* Use t.common.notification or similar if available */}
                    </HeadlessDialog.Title>
                    <div className="mt-2 text-sm text-gray-700 dark:text-gray-200 whitespace-pre-line">
                      {notice?.content}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end px-4 pb-4">
                  <button
                    className="inline-flex justify-center rounded-md border border-transparent bg-indigo-100 dark:bg-indigo-900 px-4 py-2 text-sm font-medium text-indigo-900 dark:text-indigo-100 hover:bg-indigo-200 dark:hover:bg-indigo-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                    onClick={onClose}
                  >
                    关闭 {/* Use t.common.close or similar if available */}
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