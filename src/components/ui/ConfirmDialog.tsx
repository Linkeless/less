'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Fragment } from 'react';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

interface ConfirmDialogContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmDialogContext = createContext<ConfirmDialogContextType | undefined>(undefined);

export const useConfirm = () => {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmDialogProvider');
  }
  return context;
};

export const ConfirmDialogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({ message: '' });
  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null);

  const confirm = (opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setOptions({
        title: opts.title || '确认操作',
        message: opts.message,
        confirmText: opts.confirmText || '确认',
        cancelText: opts.cancelText || '取消',
        type: opts.type || 'warning',
      });
      setResolvePromise(() => resolve);
      setIsOpen(true);
    });
  };

  const handleConfirm = () => {
    if (resolvePromise) {
      resolvePromise(true);
    }
    handleClose();
  };

  const handleCancel = () => {
    if (resolvePromise) {
      resolvePromise(false);
    }
    handleClose();
  };

  const handleClose = () => {
    setIsOpen(false);
    setResolvePromise(null);
  };

  const getButtonColors = () => {
    switch (options.type) {
      case 'danger':
        return {
          confirm: 'bg-red-600 hover:bg-red-700 focus:ring-red-500 dark:bg-red-500 dark:hover:bg-red-600',
          icon: 'text-red-600 dark:text-red-400'
        };
      case 'warning':
        return {
          confirm: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500 dark:bg-yellow-500 dark:hover:bg-yellow-600',
          icon: 'text-yellow-600 dark:text-yellow-400'
        };
      case 'info':
        return {
          confirm: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600',
          icon: 'text-blue-600 dark:text-blue-400'
        };
      default:
        return {
          confirm: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500 dark:bg-yellow-500 dark:hover:bg-yellow-600',
          icon: 'text-yellow-600 dark:text-yellow-400'
        };
    }
  };

  const colors = getButtonColors();

  return (
    <ConfirmDialogContext.Provider value={{ confirm }}>
      {children}
      
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={handleClose}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 text-left align-middle shadow-xl transition-all">
                  <div className="flex items-center">
                    <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-700 ${colors.icon}`}>
                      <ExclamationTriangleIcon className="h-6 w-6" />
                    </div>
                  </div>
                  
                  <div className="mt-3 text-center">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100"
                    >
                      {options.title}
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {options.message}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex space-x-3 justify-center">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500/20 dark:focus:ring-gray-400/20 transition-all duration-200"
                      onClick={handleCancel}
                    >
                      {options.cancelText}
                    </button>
                    <button
                      type="button"
                      className={`inline-flex justify-center rounded-lg border border-transparent px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ${colors.confirm}`}
                      onClick={handleConfirm}
                    >
                      {options.confirmText}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </ConfirmDialogContext.Provider>
  );
};