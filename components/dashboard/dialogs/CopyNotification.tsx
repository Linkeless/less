'use client';

import { Transition } from '@headlessui/react';
import { CheckIcon } from '@heroicons/react/24/outline';
import type { TranslationValues } from '@/lib/i18n/context';
import { Fragment } from 'react'; // Import Fragment for Transition

interface CopyNotificationProps {
  show: boolean;
  t: TranslationValues;
}

export default function CopyNotification({
  show,
  t
}: CopyNotificationProps) {
  return (
    <div 
      aria-live="assertive" 
      className="fixed bottom-4 right-4 z-50 pointer-events-none flex items-end px-4 py-6"
    >
      <Transition
        show={show}
        as={Fragment} // Use Fragment for Transition child
        enter="transform ease-out duration-300 transition"
        enterFrom="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
        enterTo="translate-y-0 opacity-100 sm:translate-x-0"
        leave="transition ease-in duration-100"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="rounded-lg bg-gray-900 px-4 py-3 shadow-lg">
          <div className="flex items-center space-x-2">
            <CheckIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
            <p className="text-sm font-medium text-white">
              {t.dashboard.traffic.copied} {/* Assuming this path exists */}
            </p>
          </div>
        </div>
      </Transition>
    </div>
  );
} 