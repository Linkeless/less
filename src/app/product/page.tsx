'use client'

import { useEffect, useState } from 'react'
// import { useRouter } from 'next/navigation' // 如果需要导航功能可以取消注释
import ProductList from './ProductList'
import { getSubscriptionPlans, getUserInfo } from '@/lib/client'
import { Spinner } from '@/components/ui/spinner'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import type { PurchasePlan, UserInfo, UserInfoResponse, SubscriptionPlan } from '@/lib/types'

// 适配器函数：将新的订阅计划数据转换为组件期望的旧格式
// 由于新API每个计划都有独立的billing_cycle，我们需要按名称分组并合并不同周期的价格
const adaptSubscriptionPlansToGroupedPlans = (plans: SubscriptionPlan[]): PurchasePlan[] => {
  const groupedPlans = new Map<string, PurchasePlan>();

  plans.forEach((plan) => {
    const key = plan.code || plan.name; // 使用code作为分组键，如果没有则使用name
    
    if (!groupedPlans.has(key)) {
      // 创建基础计划结构
      groupedPlans.set(key, {
        id: plan.id,
        name: plan.name,
        content: plan.description,
        show: plan.is_visible ? 1 : 0,
        sort: plan.sort_order,
        transfer_enable: plan.traffic_limit,
        
        // 初始化所有价格字段为null
        month_price: null,
        year_price: null,
        onetime_price: null,
        quarter_price: null,
        half_year_price: null,
        two_year_price: null,
        three_year_price: null,
        reset_price: null,
        
        // 默认值
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
    
    // 根据billing_cycle设置对应的价格字段
    // 新API的价格以元为单位，但旧组件期望以分为单位，所以需要乘以100
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
      // 可以根据需要添加其他周期
    }
  });

  return Array.from(groupedPlans.values());
};

export default function ProductPage() {
  // const router = useRouter() // 如果需要导航功能可以取消注释
  const [products, setProducts] = useState<PurchasePlan[]>([])
  const [user, setUser] = useState<UserInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // 并行获取产品和用户信息
        const [productsResponse, userResponse] = await Promise.allSettled([
          getSubscriptionPlans(),
          getUserInfo() as Promise<UserInfoResponse>
        ])

        // 处理产品数据
        if (productsResponse.status === 'fulfilled' && productsResponse.value.data) {
          // 将新的订阅计划数据转换为旧格式以保持兼容性
          const adaptedProducts = adaptSubscriptionPlansToGroupedPlans(productsResponse.value.data)
          setProducts(adaptedProducts)
        } else {
          setProducts([])
        }

        // 处理用户数据
        if (userResponse.status === 'fulfilled' && userResponse.value.data) {
          setUser(userResponse.value.data)
        } else {
          setUser(null)
          // 用户未登录，这是正常情况，不设置错误状态
        }

      } catch (err) {
        console.error('Failed to fetch data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load data')
        setProducts([])
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

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
  if (error) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md mx-4">
          <Alert variant="destructive">
            <AlertTitle>加载失败</AlertTitle>
            <AlertDescription>
              <p className="mb-4">{error}</p>
              <Button 
                onClick={() => window.location.reload()}
                variant="outline"
                size="sm"
              >
                重试
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <ProductList 
      initialProducts={products} 
      initialUser={user}
    />
  )
}
