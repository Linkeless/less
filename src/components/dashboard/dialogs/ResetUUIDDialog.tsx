'use client';

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle, Transition } from '@headlessui/react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import type { TranslationValues } from '@/lib/i18n/context';
import { Fragment } from 'react'; // Import Fragment for Transition

interface ResetUUIDDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  t: TranslationValues;
}

export default function ResetUUIDDialog({
  isOpen,
  onClose,
  onConfirm,
  t
}: ResetUUIDDialogProps) {
  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-10">
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-gray-500/75 dark:bg-gray-950/75 backdrop-blur-sm transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
        />
        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <DialogPanel
              transition
              className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 text-left shadow-xl transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-8 sm:w-full sm:max-w-lg data-closed:sm:translate-y-0 data-closed:sm:scale-95"
            >
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full bg-yellow-100 sm:mx-0 sm:size-10">
                    <ExclamationTriangleIcon aria-hidden="true" className="size-6 text-yellow-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <DialogTitle as="h3" className="text-base font-semibold text-gray-900 dark:text-gray-100">
                      {t.dashboard.uuid.reset} {/* Assuming this path exists in your t object */}
                    </DialogTitle>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t.dashboard.uuid.confirmReset} {/* Assuming this path exists */}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                  type="button"
                  onClick={onConfirm}
                  className="inline-flex w-full justify-center rounded-md bg-gradient-to-r from-indigo-600 to-indigo-500 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:from-indigo-500 hover:to-indigo-400 sm:ml-3 sm:w-auto transition-all duration-200"
                >
                  {t.dashboard.uuid.reset} {/* Assuming this path exists */}
                </button>
                <button
                  type="button"
                  data-autofocus
                  onClick={onClose}
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white dark:bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100 ring-1 shadow-xs ring-gray-300 dark:ring-gray-700 ring-inset hover:bg-gray-50 dark:hover:bg-gray-700 sm:mt-0 sm:w-auto transition-all duration-200"
                >
                  {t.dashboard.uuid.cancel} {/* Assuming this path exists */}
                </button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
} 