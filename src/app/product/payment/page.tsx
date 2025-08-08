'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { getOrderDetail, getPaymentMethods, getUserInfo } from '@/lib/client'
import PaymentForm from './PaymentForm'
import { Spinner } from '@/components/ui/spinner'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import type { UserInfo, OrderDetailResponse, PaymentMethodResponse, UserInfoResponse } from '@/lib/types'

export default function PaymentPage() {
  const searchParams = useSearchParams()
  const [orderData, setOrderData] = useState<unknown>(null)
  const [paymentMethods, setPaymentMethods] = useState<unknown[]>([])
  const [user, setUser] = useState<UserInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // 获取URL参数 - 支持新的payment_no、order_id或旧的trade_no
        const paymentNo = searchParams.get('payment_no') || searchParams.get('order_id') || searchParams.get('trade_no')
        
        if (!paymentNo) {
          setError('订单号缺失')
          setIsLoading(false)
          return
        }

        // 并行获取订单详情、支付方式和用户信息
        const [orderResponse, methodsResponse, userResponse] = await Promise.allSettled([
          getOrderDetail(paymentNo),
          getPaymentMethods(),
          getUserInfo() as Promise<UserInfoResponse>
        ])

        // 处理订单数据
        if (orderResponse.status === 'fulfilled' && orderResponse.value.data) {
          // 如果是一次性订单，确保使用 onetime_price
          const processedOrderData = {
            ...orderResponse.value.data,
            is_onetime: orderResponse.value.data.period === 'onetime_price' && 
                        orderResponse.value.data.plan?.onetime_price ? true : false
          }
          setOrderData(processedOrderData)
        } else {
          setError('订单未找到')
          setIsLoading(false)
          return
        }

        // 处理支付方式数据
        if (methodsResponse.status === 'fulfilled' && methodsResponse.value.data) {
          setPaymentMethods(methodsResponse.value.data)
        } else {
          setError('无法获取支付方式')
          setIsLoading(false)
          return
        }

        // 处理用户数据
        if (userResponse.status === 'fulfilled' && userResponse.value.data) {
          setUser(userResponse.value.data)
        } else {
          setUser(null)
          // 用户未登录是正常情况，不设置错误状态
        }

      } catch (err) {
        console.error('Failed to fetch payment data:', err)
        setError(err instanceof Error ? err.message : '加载数据失败')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [searchParams])

  // 加载状态
  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">加载支付信息...</p>
        </div>
      </div>
    )
  }

  // 错误状态
  if (error || !orderData) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md mx-4">
          <Alert variant="destructive">
            <AlertTitle>加载失败</AlertTitle>
            <AlertDescription>
              <p className="mb-4">{error || '订单未找到'}</p>
              <div className="flex gap-2">
                <Button 
                  onClick={() => window.location.reload()}
                  variant="outline"
                  size="sm"
                >
                  重试
                </Button>
                <Button 
                  onClick={() => window.history.back()}
                  variant="secondary"
                  size="sm"
                >
                  返回
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <PaymentForm
      initialOrder={orderData as any}
      paymentMethods={paymentMethods as any}
      user={user}
    />
  )
}
