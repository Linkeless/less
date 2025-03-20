'use client'

import { RadioGroup } from '@headlessui/react'
import { useState } from 'react'

const paymentMethods = [
  { id: 'alipay', title: 'Alipay' },
  { id: 'wechat', title: 'WeChat Pay' },
]

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function OrderPage() {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(paymentMethods[0])

  return (
    <div className="bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 pb-24 pt-16 sm:px-6 lg:max-w-7xl lg:px-8">
        <h2 className="sr-only">Checkout</h2>

        <form className="lg:grid lg:grid-cols-2 lg:gap-x-12 xl:gap-x-16">
          <div>
            <div>
              <h2 className="text-lg font-medium text-gray-900">Contact information</h2>

              <div className="mt-4">
                <label htmlFor="email-address" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    type="email"
                    id="email-address"
                    name="email-address"
                    autoComplete="email"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="mt-10 border-t border-gray-200 pt-10">
              <h2 className="text-lg font-medium text-gray-900">Payment method</h2>

              <RadioGroup value={selectedPaymentMethod} onChange={setSelectedPaymentMethod} className="mt-4">
                <RadioGroup.Label className="sr-only">Payment method</RadioGroup.Label>
                <div className="space-y-4">
                  {paymentMethods.map((payment) => (
                    <RadioGroup.Option
                      key={payment.id}
                      value={payment}
                      className={({ checked }) =>
                        classNames(
                          checked ? 'border-transparent' : 'border-gray-300',
                          'relative block cursor-pointer rounded-lg border bg-white px-6 py-4 shadow-sm focus:outline-none sm:flex sm:justify-between'
                        )
                      }
                    >
                      {({ active, checked }) => (
                        <>
                          <span className="flex items-center">
                            <span className="flex flex-col text-sm">
                              <RadioGroup.Label as="span" className="font-medium text-gray-900">
                                {payment.title}
                              </RadioGroup.Label>
                            </span>
                          </span>
                          <span
                            className={classNames(
                              active ? 'border' : 'border-2',
                              checked ? 'border-indigo-500' : 'border-transparent',
                              'pointer-events-none absolute -inset-px rounded-lg'
                            )}
                            aria-hidden="true"
                          />
                        </>
                      )}
                    </RadioGroup.Option>
                  ))}
                </div>
              </RadioGroup>
            </div>
          </div>

          {/* Order summary */}
          <div className="mt-10 lg:mt-0">
            <h2 className="text-lg font-medium text-gray-900">Order summary</h2>

            <div className="mt-4 rounded-lg border border-gray-200 bg-white shadow-sm">
              <dl className="space-y-6 border-t border-gray-200 px-4 py-6 sm:px-6">
                <div className="flex items-center justify-between border-t border-gray-200 pt-6">
                  <dt className="text-base font-medium">Total</dt>
                  <dd className="text-base font-medium text-gray-900">¥XXX.XX</dd>
                </div>
              </dl>

              <div className="border-t border-gray-200 px-4 py-6 sm:px-6">
                <button
                  type="submit"
                  className="w-full rounded-md border border-transparent bg-indigo-600 px-4 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-50"
                >
                  Confirm order
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
