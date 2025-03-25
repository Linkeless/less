'use client'

import { useState, useEffect } from 'react'
import TitleBar from '@/components/TitleBar'
import md5 from 'md5'
import { fetchOrders, fetchUserInfo, cancelOrder } from '@/lib/api'

interface Order {
  trade_no: string;
  created_at: number;
  total_amount: number;
  status: number;
  payment_method: string;
  period?: string; // Add period field
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [userInfo, setUserInfo] = useState<any>(null)

  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        const response = await fetchOrders()
        if (response.status === 'success') {
          setOrders(response.data)
        }
      } catch (error) {
        console.error('Failed to fetch orders:', error)
      } finally {
        setLoading(false)
      }
    }

    const fetchUserData = async () => {
      try {
        const response = await fetchUserInfo()
        setUserInfo(response.data)
      } catch (error) {
        console.error('Failed to fetch user info:', error)
      }
    }

    fetchOrderData()
    fetchUserData()
  }, [])

  const handleCancelOrder = async (trade_no: string) => {
    if (confirm('Are you sure you want to cancel this order?')) {
      try {
        const response = await cancelOrder(trade_no)
        if (response.status === 'success') {
          // Refresh orders list
          const ordersResponse = await fetchOrders()
          if (ordersResponse.status === 'success') {
            setOrders(ordersResponse.data)
          }
        } else {
          alert(response.message || 'Failed to cancel order')
        }
      } catch (error) {
        console.error('Failed to cancel order:', error)
        alert('Failed to cancel order')
      }
    }
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', current: false },
    { name: 'Product', href: '/product', current: false },
    { name: 'Orders', href: '/orders', current: true },
  ]

  const userNavigation = [
    { 
      name: 'Sign out', 
      onClick: () => {
        localStorage.clear()
        window.location.href = '/login'
      }
    },
  ]

  const user = userInfo ? {
    name: userInfo.email.split('@')[0],
    email: userInfo.email,
    imageUrl: `https://www.gravatar.com/avatar/${md5(userInfo.email.trim().toLowerCase())}?s=256&d=monsterid`,
  } : {
    name: 'User',
    email: '',
    imageUrl: `https://www.gravatar.com/avatar/default?s=256&d=monsterid`,
  }

  function formatDate(timestamp: number) {
    return new Date(timestamp * 1000).toLocaleString()
  }

  function getStatusColor(status: number) {
    switch (status) {
      case 0: return 'bg-yellow-50 text-yellow-700' // Unpaid
      case 3: return 'bg-green-50 text-green-700' // Paid
      case 2: return 'bg-gray-50 text-gray-600' // Cancelled
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
      case 'month_price':
        return 'Monthly';
      case 'quarter_price':
        return 'Quarterly';
      case 'half_year_price':
        return 'Semi-Annual';
      case 'year_price':
        return 'Annual';
      case 'two_year_price':
        return '2-Year';
      case 'three_year_price':
        return '3-Year';
      default:
        return 'Unknown';
    }
  }

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex flex-col">
        <TitleBar user={user} navigation={navigation} userNavigation={userNavigation} />
        <div className="flex justify-center items-center flex-1">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <TitleBar user={user} navigation={navigation} userNavigation={userNavigation} />
      
      <div className="flex-1 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl">
            <div className="border-b border-gray-200 px-4 py-5 sm:px-6">
              <h3 className="text-base font-semibold leading-6 text-gray-900">Order History</h3>
            </div>
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
          </div>
        </div>
      </div>
    </div>
  )
}
