'use client'

import { useEffect, useState, useTransition } from 'react'
import { fetchOrders, cancelOrder } from '@/lib/actions'
import type { Order } from '@/lib/types'

export default function OrdersTable() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isPending, startTransition] = useTransition()

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

  const handleCancelOrder = async (trade_no: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) return
    
    startTransition(async () => {
      try {
        const result = await cancelOrder(trade_no)
        if (result.status === 'success') {
          const response = await fetchOrders()
          if (response.status === 'success') {
            setOrders(response.data)
          }
        }
      } catch (error) {
        console.error('Failed to cancel order:', error)
        alert('Failed to cancel order')
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
      case 0: return 'Unpaid'
      case 3: return 'Paid'
      case 2: return 'Cancelled'
      default: return 'Unknown'
    }
  }

  function formatPeriod(period: string | undefined) {
    switch (period) {
      case 'month_price': return 'Monthly'
      case 'quarter_price': return 'Quarterly'
      case 'half_year_price': return 'Semi-Annual'
      case 'year_price': return 'Annual'
      case 'two_year_price': return '2-Year'
      case 'three_year_price': return '3-Year'
      default: return 'Unknown'
    }
  }

  if (isPending) {
    return <div className="p-4 text-center">Processing...</div>
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-300">
        <thead>
          <tr>
            <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Order Number</th>
            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Period</th>
            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Amount (¥)</th>
            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Created At</th>
            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {orders.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-4 pl-4 pr-3 text-sm text-center text-gray-500 sm:pl-6">
                No orders found
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
                      View details
                    </button>
                    {order.status === 0 && (
                      <button
                        type="button"
                        onClick={() => handleCancelOrder(order.trade_no)}
                        className="text-red-600 hover:text-red-900"
                        disabled={isPending}
                      >
                        Cancel
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
  )
}
