'use client'

import { useEffect, useState, useTransition, Fragment } from 'react'
import { fetchOrders, cancelOrder } from '@/lib/actions'
import type { Order } from '@/lib/types'
import { Dialog, Transition } from '@headlessui/react'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { useLanguage } from '@/lib/i18n/hooks'

export default function OrdersTable() {
  const { t } = useLanguage()
  const [orders, setOrders] = useState<Order[]>([])
  const [isPending, startTransition] = useTransition()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedOrderNo, setSelectedOrderNo] = useState('')

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const response = await fetchOrders()
        if (response.status === 'success') {
          setOrders(response.data)
        }
      } catch (error) {
        console.error('Failed to fetch orders:', error)
      }
    }
    loadOrders()
  }, [])

  const openCancelDialog = (trade_no: string) => {
    setSelectedOrderNo(trade_no)
    setIsDialogOpen(true)
  }

  const handleCancelOrder = async () => {
    setIsDialogOpen(false)
    
    startTransition(async () => {
      try {
        const result = await cancelOrder(selectedOrderNo)
        if (result.status === 'success') {
          const response = await fetchOrders()
          if (response.status === 'success') {
            setOrders(response.data)
          }
        }
      } catch (error) {
        console.error('Failed to cancel order:', error)
        alert(t?.orders?.cancelFailed || 'Failed to cancel order')
      }
    })
  }

  function formatDate(timestamp: number) {
    return new Date(timestamp * 1000).toLocaleString()
  }

  function getStatusColor(status: number) {
    switch (status) {
      case 0: return 'bg-yellow-50 text-yellow-700'
      case 3: return 'bg-green-50 text-green-700'
      case 2: return 'bg-gray-50 text-gray-600'
      default: return 'bg-gray-50 text-gray-600'
    }
  }

  function getStatusText(status: number) {
    switch (status) {
      case 0: return t?.orders?.unpaid || 'Unpaid'
      case 3: return t?.orders?.paid || 'Paid'
      case 2: return t?.orders?.cancel || 'Cancelled'
      default: return t?.orders?.unknown || 'Unknown'
    }
  }

  function formatPeriod(period: string | undefined) {
    switch (period) {
      case 'month_price': return t?.orders?.monthly || 'Monthly'
      case 'quarter_price': return t?.orders?.quarterly || 'Quarterly'
      case 'half_year_price': return t?.orders?.semiAnnual || 'Semi-Annual'
      case 'year_price': return t?.orders?.annual || 'Annual'
      case 'two_year_price': return t?.orders?.twoYear || '2-Year'
      case 'three_year_price': return t?.orders?.threeYear || '3-Year'
      default: return t?.orders?.unknown || 'Unknown'
    }
  }

  if (isPending) {
    return <div className="p-4 text-center">{t?.common?.processing || 'Processing...'}</div>
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-300">
          <thead>
            <tr>
              <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">{t?.orders?.orderNumber || 'Order Number'}</th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">{t?.orders?.period || 'Period'}</th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">{t?.orders?.amount || 'Amount'} (¥)</th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">{t?.orders?.status || 'Status'}</th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">{t?.orders?.createdAt || 'Created At'}</th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">{t?.orders?.actions || 'Actions'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-4 pl-4 pr-3 text-sm text-center text-gray-500 sm:pl-6">
                  {t?.orders?.noOrdersFound || 'No orders found'}
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.trade_no}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900 sm:pl-6">
                    {order.trade_no}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {formatPeriod(order.period)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                    {(order.total_amount / 100).toFixed(2)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm">
                    <span className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {formatDate(order.created_at)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => window.location.href = `/product/payment?trade_no=${order.trade_no}`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        {t?.orders?.viewDetails || 'View details'}
                      </button>
                      {order.status === 0 && (
                        <button
                          type="button"
                          onClick={() => openCancelDialog(order.trade_no)}
                          className="text-red-600 hover:text-red-900"
                          disabled={isPending}
                        >
                          {t?.orders?.cancel || 'Cancel'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 取消订单确认对话框 */}
      <Transition.Root show={isDialogOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={setIsDialogOpen}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                      <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                    </div>
                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                      <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                        {t?.orders?.confirmCancellation || 'Confirm Cancellation'}
                      </Dialog.Title>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          {t?.orders?.cancelConfirmText || 'Are you sure you want to cancel this order? This action cannot be undone.'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                    <button
                      type="button"
                      className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto"
                      onClick={handleCancelOrder}
                    >
                      {t?.orders?.confirm || 'Confirm'}
                    </button>
                    <button
                      type="button"
                      className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      {t?.common?.cancel || 'Cancel'}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  )
}
