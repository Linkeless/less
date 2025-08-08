'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import OrderForm from './OrderForm'
import { getSubscriptionPlans, getUserInfo } from '@/lib/client'
import { Spinner } from '@/components/ui/spinner'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import type { PurchasePlan, UserInfo, UserInfoResponse, SubscriptionPlan } from '@/lib/types'

// 与产品页面相同的适配器函数
const adaptSubscriptionPlansToGroupedPlans = (plans: SubscriptionPlan[]): PurchasePlan[] => {
  const groupedPlans = new Map<string, PurchasePlan>();

  plans.forEach((plan) => {
    const key = plan.code || plan.name;
    
    if (!groupedPlans.has(key)) {
      groupedPlans.set(key, {
        id: plan.id,
        name: plan.name,
        content: plan.description,
        show: plan.is_visible ? 1 : 0,
        sort: plan.sort_order,
        transfer_enable: plan.traffic_limit,
        
        month_price: null,
        year_price: null,
        onetime_price: null,
        quarter_price: null,
        half_year_price: null,
        two_year_price: null,
        three_year_price: null,
        reset_price: null,
        
        group_id: 0,
        speed_limit: null,
        renew: 1,
        reset_traffic_method: null,
        capacity_limit: null,
        created_at: new Date(plan.created_at).getTime(),
        updated_at: new Date(plan.updated_at).getTime(),
      });
    }

    const existingPlan = groupedPlans.get(key)!;
    
    switch (plan.billing_cycle) {
      case 'monthly':
        existingPlan.month_price = plan.price * 100;
        break;
      case 'yearly':
        existingPlan.year_price = plan.price * 100;
        break;
      case 'onetime':
        existingPlan.onetime_price = plan.price * 100;
        break;
    }
  });

  return Array.from(groupedPlans.values());
};

export default function OrderPage() {
  const searchParams = useSearchParams()
  const [product, setProduct] = useState<PurchasePlan | null>(null)
  const [user, setUser] = useState<UserInfo | null>(null)
  const [couponValue, setCouponValue] = useState<number | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // 获取URL参数
        const id = searchParams.get('id')
        const couponValueParam = searchParams.get('couponValue')
        
        if (!id) {
          setError('产品ID缺失')
          setIsLoading(false)
          return
        }

        // 解析优惠券价值
        const parsedCouponValue = couponValueParam ? parseFloat(couponValueParam) : undefined

        // 并行获取产品列表和用户信息
        const [productResponse, userResponse] = await Promise.allSettled([
          getSubscriptionPlans(),
          getUserInfo() as Promise<UserInfoResponse>
        ])

        // 处理产品数据 - 从列表中找到指定ID的产品
        if (productResponse.status === 'fulfilled' && productResponse.value.data) {
          // 转换新的API数据格式为旧格式
          const adaptedProducts = adaptSubscriptionPlansToGroupedPlans(productResponse.value.data)
          
          const targetProduct = adaptedProducts.find(p => p.id === parseInt(id))
          
          if (targetProduct) {
            setProduct(targetProduct)
          } else {
            setError('产品未找到')
            setIsLoading(false)
            return
          }
        } else {
          setError('产品未找到')
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

        // 设置优惠券价值
        setCouponValue(parsedCouponValue)

      } catch (err) {
        console.error('Failed to fetch data:', err)
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
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">加载中...</p>
        </div>
      </div>
    )
  }

  // 错误状态
  if (error || !product) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md mx-4">
          <Alert variant="destructive">
            <AlertTitle>加载失败</AlertTitle>
            <AlertDescription>
              <p className="mb-4">{error || '产品未找到'}</p>
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
    <OrderForm 
      initialProduct={product}
      user={user}
      couponValue={couponValue}
    />
  )
}
