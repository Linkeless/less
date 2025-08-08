'use client'

import { useEffect, useState } from 'react'
import { fetchOrders } from '@/lib/client'
import type { SubscriptionOrderResponse, SubscriptionPlanResponse } from '@/lib/types'
// 取消订单在用户端API未提供，移除弹窗依赖
import { useLanguage } from '@/lib/i18n/hooks'

export default function OrdersTable() {
  const { t } = useLanguage()
  const [orders, setOrders] = useState<SubscriptionOrderResponse[]>([])
  const [isLoading, setIsLoading] = useState(false)
  // 删除取消订单相关状态
  const [error, setError] = useState<string | null>(null)

  // 根据新订阅API的 billing_cycle 与 billing_interval 构造展示用周期文案
  const getPeriodLabelFromPlan = (plan?: SubscriptionPlanResponse): string => {
    if (!plan) return t?.orders?.unknown || 'Unknown'
    const period = (plan.billing_period || '').toLowerCase()
    // 支持按新的 billing_period（如 monthly/yearly/one-time）
    if (period === 'lifetime' || period === 'one-time' || period === 'onetime') {
      return t?.product?.billing?.oneTime || 'One-time'
    }
    if (period === 'yearly') {
      return t?.product?.billing?.annual || 'Annual'
    }
    if (period === 'monthly') return t?.product?.billing?.monthly || 'Monthly'
    if (period === 'quarterly') return t?.product?.billing?.quarterly || 'Quarterly'
    if (period === 'semi-annual' || period === 'half-year' || period === 'half_year') return t?.product?.billing?.semiAnnual || 'Semi-Annual'
    return t?.orders?.unknown || 'Unknown'
  }

  // 辅助函数：从字符串状态获取状态文本
  const getStatusTextFromString = (status: string): string => {
    switch (status?.toLowerCase()) {
      case 'pending': return t?.orders?.unpaid || 'Unpaid';
      case 'paid': return t?.orders?.paid || 'Paid';
      case 'cancelled': return t?.orders?.cancel || 'Cancelled';
      default: return t?.orders?.unknown || 'Unknown';
    }
  }

  useEffect(() => {
    const loadOrders = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetchOrders(100, 0) // 获取前100条订单
        if (response.code === 0) {
          const items = Array.isArray(response.data) ? response.data : []
          setOrders(items as SubscriptionOrderResponse[])
        } else {
          setError(response.message || 'Failed to fetch orders')
        }
      } catch (error) {
        console.error('Failed to fetch orders:', error)
        setError(error instanceof Error ? error.message : 'Failed to fetch orders')
      } finally {
        setIsLoading(false)
      }
    }
    loadOrders()
  }, [])

  // 取消订单功能暂不支持，无用户端API

  function formatDate(isoString: string) {
    return new Date(isoString).toLocaleString()
  }

  function getStatusColor(status: string) {
    const s = (status || '').toLowerCase()
    switch (s) {
      case 'pending': return 'bg-yellow-50 text-yellow-700'
      case 'paid': return 'bg-green-50 text-green-700'
      case 'cancelled': return 'bg-gray-50 text-gray-600'
      case 'overdue': return 'bg-orange-50 text-orange-700'
      case 'voided': return 'bg-gray-50 text-gray-600'
      default: return 'bg-gray-50 text-gray-600'
    }
  }

  function getStatusText(status: string) {
    return getStatusTextFromString(status)
  }

  // 由订阅计划信息动态生成周期文案
  const formatPeriod = (plan?: SubscriptionPlanResponse) => getPeriodLabelFromPlan(plan)

  if (isLoading && orders.length === 0) {
    return <div className="p-4 text-center">{t?.common?.loading || 'Loading...'}</div>
  }

  if (error && orders.length === 0) {
    return <div className="p-4 text-center text-red-600">{error}</div>
  }

  return (
    <>
      {isLoading && orders.length > 0 && (
        <div className="absolute top-0 left-0 right-0 bg-blue-50 text-blue-700 text-sm px-4 py-2 text-center">
          {t?.common?.processing || 'Processing...'}
        </div>
      )}
      <div className="overflow-x-auto relative">
        <table className="min-w-full divide-y divide-gray-300">
          <thead>
            <tr>
              <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">{t?.orders?.orderNumber || 'Order Number'}</th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">{t?.orders?.period || 'Period'}</th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">{t?.orders?.amount || 'Amount'}</th>
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
                <tr key={order.order_number}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900 sm:pl-6">
                    {order.order_number}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {formatPeriod(order.subscription_plan)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                    {Number(order.total_amount).toFixed(2)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm">
                    <span className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusColor(order.status as string)}`}>
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
                        onClick={() => window.location.href = `/product/payment?order_id=${order.id}`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        {t?.orders?.viewDetails || 'View details'}
                      </button>
                      {/* 取消订单按钮已移除 */}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 取消订单确认对话框已移除 */}
    </>
  )
}
