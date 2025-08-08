'use client'

import { useState } from 'react'
import md5 from 'md5'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { checkCoupon, getSubscription, createOrder } from '@/lib/client'
import TitleBar from '@/components/layout/title-bar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Spinner } from '@/components/ui/spinner'
import type { UserInfo, PurchasePlan } from '@/lib/types'
import { useLanguage } from '@/lib/i18n/hooks';
import { cn } from '@/lib/utils'

export interface OrderFormProps {
  initialProduct: PurchasePlan;
  user: UserInfo | null;
  couponValue?: number;
}

interface ContentProps {
  html: string;
}

function Content({ html }: ContentProps) {
  return (
    <div 
      className="mt-4 [&_.t4]:mb-4 [&_.tit]:font-medium [&_.tit]:text-gray-900 dark:[&_.tit]:text-gray-100 [&_.desc]:mt-2 [&_.desc]:text-gray-600 dark:[&_.desc]:text-gray-400 [&_i.gou]:mr-2 [&_i.gou]:inline-block [&_i.gou]:h-4 [&_i.gou]:w-4 [&_i.gou]:rounded-full [&_i.gou]:bg-blue-50 dark:[&_i.gou]:bg-blue-900/50 [&_i.gou]:text-blue-500 dark:[&_i.gou]:text-blue-300 [&_i.gou:before]:content-['✓']" 
      dangerouslySetInnerHTML={{ __html: html }} 
    />
  );
}

const formSchema = z.object({
  period: z.enum(['month', 'quarter', 'half_year', 'year', 'onetime']),
  couponCode: z.string().optional(),
})

export default function OrderForm({ initialProduct, user, couponValue }: OrderFormProps) {
  const { t } = useLanguage();
  const [discount, setDiscount] = useState(0)
  const [discountType, setDiscountType] = useState(0) // 2: percent, 1: fixed
  const [discountValue, setDiscountValue] = useState(0)
  const [couponError, setCouponError] = useState('')
  const [orderError, setOrderError] = useState('') // 新增订单错误信息状态
  const [checkingCoupon, setCheckingCoupon] = useState(false)
  const [checkingSubscription, setCheckingSubscription] = useState(false)
  
  // 构建可选的计费周期
  const availablePeriods = [
    ...(initialProduct.month_price ? [{ value: 'month' as const, label: t.product.billing.monthly, price: initialProduct.month_price / 100, unit: t.product.billing.perMonth }] : []),
    ...(initialProduct.quarter_price ? [{ value: 'quarter' as const, label: t.product.billing.quarterly, price: initialProduct.quarter_price / 100, unit: t.product.billing.perQuarter }] : []),
    ...(initialProduct.half_year_price ? [{ value: 'half_year' as const, label: t.product.billing.semiAnnual, price: initialProduct.half_year_price / 100, unit: t.product.billing.perSemiAnnual }] : []),
    ...(initialProduct.year_price ? [{ value: 'year' as const, label: t.product.billing.annual, price: initialProduct.year_price / 100, unit: t.product.billing.perYear }] : []),
    ...(initialProduct.onetime_price ? [{ value: 'onetime' as const, label: t.product.billing.oneTime, price: initialProduct.onetime_price / 100, unit: '' }] : [])
  ];
  
  // 默认选择存在的最小周期，包括一次性选项
  const getDefaultPeriod = (): 'month' | 'quarter' | 'half_year' | 'year' | 'onetime' => {
    if (initialProduct.month_price) return 'month';
    if (initialProduct.quarter_price) return 'quarter';
    if (initialProduct.half_year_price) return 'half_year';
    if (initialProduct.year_price) return 'year';
    if (initialProduct.onetime_price) return 'onetime';
    return 'month'; // 默认月付，虽然可能不存在
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      period: getDefaultPeriod(),
      couponCode: '',
    },
  })

  const selectedPeriod = form.watch('period')
  const couponCode = form.watch('couponCode') || ''

  const handleCheckCoupon = async () => {
    try {
      setCheckingCoupon(true)
      setCouponError('')
      setDiscount(0)
      setDiscountValue(0)
      const result = await checkCoupon(couponCode, initialProduct.id)
      if (result.code === 0 && result.data) {
        const discountVal = Number(result.data.value)
        if (!isNaN(discountVal)) {
          setDiscountValue(discountVal)
          setDiscountType(result.data.type)
          if (result.data.type === 2) {
            setDiscount(discountVal)
          }  
        }
      } else {
        setCouponError(result.message || '无效的优惠码')
        setDiscount(0)
        setDiscountValue(0)
      }
    } catch (error: any) {
      // 优化：尽量提取后端返回的message
      let msg = '优惠码验证失败'
      if (error?.message) {
        msg = error.message
      }
      if (error?.response?.message) {
        msg = error.response.message
      }
      if (error?.data?.message) {
        msg = error.data.message
      }
      setCouponError(msg)
      setDiscount(0)
      setDiscountValue(0)
    } finally {
      setCheckingCoupon(false)
    }
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setCheckingSubscription(true)
      setOrderError('') // 清空之前的错误
      
      // 如果不是一次性购买，则需要检查当前订阅
      if (values.period !== 'onetime') {
        const response = await getSubscription('active', 1, 0) // 获取活跃订阅
        
        if (response.data && response.data.length > 0) {
          const confirmed = window.confirm('注意：更改订阅将覆盖您当前的订阅计划。')
          if (!confirmed) {
            setCheckingSubscription(false);
            return;
          }
        }
      }

      const orderResponse = await createOrder({
        subscription_plan_id: initialProduct.id,
        order_type: 'new',
        coupon_code: values.couponCode,
        return_url: window.location.origin + '/dashboard'
      })

      if (orderResponse.code === 0 && orderResponse.data) {
        window.location.href = `/product/payment?payment_no=${orderResponse.data.payment_no || orderResponse.data}`
      } else {
        setOrderError(orderResponse.message || '创建订单失败')
      }
    } catch (error: any) {
      console.error('处理订单失败:', error)
      setOrderError(error.message || '处理订单失败')
    } finally {
      setCheckingSubscription(false)
    }
  }

  const getPeriodPrice = () => {
    if (!initialProduct) return 0;
    switch (selectedPeriod) {
      case 'month':
        return initialProduct.month_price || 0;
      case 'quarter':
        return initialProduct.quarter_price || 0;
      case 'half_year':
        return initialProduct.half_year_price || 0;
      case 'year':
        return initialProduct.year_price || 0;
      case 'onetime':
        return initialProduct.onetime_price || 0;
      default:
        return 0;
    }
  }

  const calculateDiscountRate = (periodPrice: number, periodMonths: number) => {
    if (!initialProduct.month_price || periodPrice === 0) return null;
    const monthlyPrice = initialProduct.month_price;
    const totalMonthlyPrice = monthlyPrice * periodMonths;
    const discount = ((totalMonthlyPrice - periodPrice) / totalMonthlyPrice) * 100;
    return discount > 0 ? discount.toFixed(0) : null;
  }

  const getPeriodDiscount = (period: string) => {
    if (!initialProduct.month_price) return null;
    
    switch (period) {
      case 'quarter':
        return calculateDiscountRate(initialProduct.quarter_price || 0, 3);
      case 'half_year':
        return calculateDiscountRate(initialProduct.half_year_price || 0, 6);
      case 'year':
        return calculateDiscountRate(initialProduct.year_price || 0, 12);
      default:
        return null;
    }
  }

  const calculatePrices = () => {
    const basePrice = getPeriodPrice() / 100 // Convert to yuan
    let discountAmount = 0
    if (discountValue > 0) {
      if (discountType === 2) {
        // For percentage discount, directly use discountValue as percentage
        discountAmount = basePrice * (discountValue / 100)
      } else {
        discountAmount = discountValue / 100
      }
    }
    
    const finalPrice = Math.max(0, basePrice - discountAmount)
    return { basePrice, discountAmount, finalPrice }
  }

  const getPeriodText = () => {
    switch (selectedPeriod) {
      case 'month': return t.product.billing.monthly;
      case 'quarter': return t.product.billing.quarterly;
      case 'half_year': return t.product.billing.semiAnnual;
      case 'year': return t.product.billing.annual;
      case 'onetime': return t.product.billing.oneTime;
      default: return t.product.billing.monthly;
    }
  }

  const getTrafficText = () => {
    if (!initialProduct) return '';
    const GB = initialProduct.transfer_enable;
    
    // 为一次性产品添加特殊处理
    if (initialProduct.onetime_price) {
      return GB >= 1024 ? `${(GB / 1024).toFixed(0)}TB/${t.product.billing.oneTime}` : `${GB}GB/${t.product.billing.oneTime}`;
    }
    
    if (initialProduct.reset_traffic_method === 4) {
      return GB >= 1024 ? `${(GB / 1024).toFixed(0)}TB/${t.product.billing.annual}` : `${GB}GB/${t.product.billing.annual}`;
    }
    
    return GB >= 1024 ? `${(GB / 1024).toFixed(0)}TB/${t.product.billing.monthly}` : `${GB}GB/${t.product.billing.monthly}`;
  }

  const userNavigation = [
    { 
      name: 'Sign out', 
      onClick: () => {
        localStorage.clear();
        window.location.href = '/login';
      }
    },
  ]

  const renderOrderSummary = () => {
    const { basePrice, discountAmount, finalPrice } = calculatePrices()
    
    return (
      <dl className="space-y-4">
        <div className="flex items-center justify-between">
          <dt className="text-gray-600 dark:text-gray-400">{t.product.order.selectedPlan}</dt>
          <dd className="font-medium text-gray-900 dark:text-gray-100">{initialProduct.name} ({getPeriodText()})</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-gray-600 dark:text-gray-400">{t.product.payment.originalPrice}</dt>
          <dd className="font-medium text-gray-900 dark:text-gray-100">¥{basePrice.toFixed(2)}</dd>
        </div>
        {discountValue > 0 && (
          <div className="flex items-center justify-between text-green-600 dark:text-green-400">
            <dt>
              {discountType === 2
                ? `${t.product.payment.discount} (${discountValue}%)`
                : t.product.payment.discount}
            </dt>
            <dd className="font-medium">-¥{discountAmount.toFixed(2)}</dd>
          </div>
        )}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <dt className="text-lg font-medium text-gray-900 dark:text-gray-100">{t.product.payment.totalPayment}</dt>
          <dd className="text-xl font-semibold text-gray-900 dark:text-gray-100">¥{finalPrice.toFixed(2)}</dd>
        </div>
      </dl>
    )
  }

  return (
    <div className="min-h-[100dvh] flex flex-col dark:bg-gray-900 dark:text-gray-100">
      <TitleBar 
        user={{
          name: user?.email.split('@')[0] || 'User',
          email: user?.email || '',
          imageUrl: user ? `https://www.gravatar.com/avatar/${md5(user.email)}?s=256&d=monsterid` : '/default-avatar.png'
        }} 
        userNavigation={userNavigation} 
      />

      <div className="flex-1 bg-gray-50 dark:bg-gray-900">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="md:grid md:grid-cols-2 md:gap-x-8 lg:gap-x-12">
            {/* Left side - Product Information */}
            <div className="mb-8 md:mb-0">
              <Card>
                <CardHeader>
                  <CardTitle>{t.product.order.details}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{initialProduct.name}</h3>
                    <Content html={initialProduct.content} />
                  </div>
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="space-y-3">
                      {initialProduct.month_price && (
                        <div className="flex justify-between text-gray-600 dark:text-gray-400">
                          <span>{t.product.price.monthlyPrice}:</span>
                          <span className="font-medium">¥{initialProduct.month_price / 100}</span>
                        </div>
                      )}
                      {initialProduct.year_price && (
                        <div className="flex justify-between text-gray-600 dark:text-gray-400">
                          <span>{t.product.price.yearlyPrice}:</span>
                          <span className="font-medium">¥{initialProduct.year_price / 100}</span>
                        </div>
                      )}
                      {initialProduct.onetime_price && (
                        <div className="flex justify-between text-gray-600 dark:text-gray-400">
                          <span>{t.product.price.oneTimePrice}:</span>
                          <span className="font-medium">¥{initialProduct.onetime_price / 100}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-gray-600 dark:text-gray-400">
                        <span>{t.product.order.traffic}:</span>
                        <span className="font-medium">{getTrafficText()}</span>
                      </div>
                      {(initialProduct.onetime_price) && (
                        <div className="flex justify-between text-gray-600 dark:text-gray-400">
                          <span>{t.product.order.duration}:</span>
                          <Badge variant="secondary" className="text-green-600 dark:text-green-400">{t.product.order.unlimited}</Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right side - Order Form */}
            <div>
              <div className="sticky top-8 space-y-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>{t.product.billing.period}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <FormField
                          control={form.control}
                          name="period"
                          render={({ field }) => (
                            <FormItem className="space-y-3">
                              <FormControl>
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                  className="grid grid-cols-2 gap-4"
                                >
                                  {availablePeriods.map((period) => (
                                    <FormItem key={period.value}>
                                      <FormControl>
                                        <RadioGroupItem 
                                          value={period.value} 
                                          id={period.value}
                                          className="peer sr-only"
                                        />
                                      </FormControl>
                                      <Label
                                        htmlFor={period.value}
                                        className={cn(
                                          "flex flex-col items-center justify-center rounded-xl border-2 p-4 text-sm transition-colors cursor-pointer",
                                          "peer-checked:border-indigo-600 peer-checked:bg-indigo-50 peer-checked:dark:border-indigo-400 peer-checked:dark:bg-indigo-900/50 peer-checked:text-indigo-900 peer-checked:dark:text-indigo-100",
                                          "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                                        )}
                                      >
                                        <span className="font-medium">{period.label}</span>
                                        <span className="mt-1 text-gray-600 dark:text-gray-400">
                                          ¥{period.price}{period.unit}
                                        </span>
                                        {period.value !== 'month' && period.value !== 'onetime' && (
                                          <span className="mt-1 text-sm text-green-600 dark:text-green-400">
                                            {getPeriodDiscount(period.value) && `省${getPeriodDiscount(period.value)}%`}
                                          </span>
                                        )}
                                      </Label>
                                    </FormItem>
                                  ))}
                                </RadioGroup>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>{t.product.payment.summary}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {renderOrderSummary()}

                        {/* Coupon Input */}
                        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                          <FormField
                            control={form.control}
                            name="couponCode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t.product.order.coupon.title}</FormLabel>
                                <div className="flex space-x-2">
                                  <FormControl>
                                    <Input
                                      placeholder={t.product.order.coupon.placeholder}
                                      {...field}
                                    />
                                  </FormControl>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleCheckCoupon}
                                    disabled={checkingCoupon || !couponCode}
                                  >
                                    {checkingCoupon && <Spinner size="sm" className="mr-2" />}
                                    {t.product.order.coupon.verify}
                                  </Button>
                                </div>
                                {couponError && (
                                  <Alert variant="destructive" className="mt-2">
                                    <AlertDescription>{couponError}</AlertDescription>
                                  </Alert>
                                )}
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Order Error */}
                        {orderError && (
                          <Alert variant="destructive" className="mt-4">
                            <AlertTitle>订单创建失败</AlertTitle>
                            <AlertDescription>
                              {orderError}
                              {orderError.includes('未付款') && (
                                <div className="mt-2">
                                  <Button variant="link" size="sm" asChild>
                                    <a href="/orders">{t.product.order.viewPendingOrders || '查看未完成订单'}</a>
                                  </Button>
                                </div>
                              )}
                            </AlertDescription>
                          </Alert>
                        )}

                        {/* Submit Button */}
                        <div className="mt-6">
                          <Button
                            type="submit"
                            disabled={checkingSubscription}
                            className="w-full"
                            size="lg"
                          >
                            {checkingSubscription && <Spinner size="sm" className="mr-2" />}
                            {checkingSubscription ? t.product.payment.processing : t.product.payment.payNow}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </form>
                </Form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
