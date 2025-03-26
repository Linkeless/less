'use client'

import { useState } from 'react'
import md5 from 'md5'
import { checkCoupon, getSubscription, createOrder } from '@/lib/actions'
import TitleBar from '@/components/TitleBar'
import type { UserInfo, PurchasePlan } from '@/lib/types'
import { useLanguage } from '@/lib/i18n/hooks';

export interface OrderFormProps {
  initialProduct: PurchasePlan;
  user: UserInfo | null;
  couponValue?: number;
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

interface ContentProps {
  html: string;
}

function Content({ html }: ContentProps) {
  return (
    <div 
      className="mt-4 [&_.t4]:mb-4 [&_.tit]:font-medium [&_.tit]:text-gray-900 [&_.desc]:mt-2 [&_.desc]:text-gray-600 [&_i.gou]:mr-2 [&_i.gou]:inline-block [&_i.gou]:h-4 [&_i.gou]:w-4 [&_i.gou]:rounded-full [&_i.gou]:bg-blue-50 [&_i.gou]:text-blue-500 [&_i.gou:before]:content-['✓']" 
      dangerouslySetInnerHTML={{ __html: html }} 
    />
  );
}

export default function OrderForm({ initialProduct, user, couponValue }: OrderFormProps) {
  const { t } = useLanguage();
  const [couponCode, setCouponCode] = useState('')
  const [discount, setDiscount] = useState(0)
  const [discountType, setDiscountType] = useState(0) // 2: percent, 1: fixed
  const [discountValue, setDiscountValue] = useState(0)
  const [couponError, setCouponError] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'half_year' | 'year'>('month')
  const [checkingSubscription, setCheckingSubscription] = useState(false)

  const handleCheckCoupon = async () => {
    try {
      setCouponError('')
      setDiscount(0)
      setDiscountValue(0)
      const result = await checkCoupon(couponCode)
      
      
      if (result.status === 'success' && result.data) {
        const discountVal = Number(result.data.value)
        if (!isNaN(discountVal)) {
          setDiscountValue(discountVal)
          setDiscountType(result.data.type)
          if (result.data.type === 2) {
            setDiscount(discountVal)
          }  
        }
      } else {
        alert(result.message || 'Invalid coupon code')
        setCouponError(result.message || 'Invalid coupon code')
      }
    } catch (error: any) {
      console.error('Failed to verify coupon:', error)
      alert(error.message || 'Failed to verify coupon')
      setCouponError('Coupon verification failed')
      setDiscount(0)
      setDiscountValue(0)
    }
  }

  const handleConfirmPayment = async () => {
    try {
      setCheckingSubscription(true)
      const response = await getSubscription()
      
      if (response.data?.plan_id) {
        const confirmed = window.confirm('Note: Changing subscription will override your current subscription.')
        if (!confirmed) return;
      }

      const period = `${selectedPeriod}_price`
      const orderResponse = await createOrder({
        period,
        plan_id: initialProduct.id,
        coupon_code: couponCode
      })

      if (orderResponse.status === 'success' && orderResponse.data) {
        window.location.href = `/product/payment?trade_no=${orderResponse.data}`
      } else {
        alert(orderResponse.message || 'Failed to create order')
      }
    } catch (error: any) {
      console.error('Failed to process order:', error)
      alert(error.message || 'Failed to process order')
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
      default:
        return 0;
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
      case 'month': return 'Monthly';
      case 'quarter': return 'Quarterly';
      case 'half_year': return 'Semi-Annual';
      case 'year': return 'Annual';
      default: return 'Monthly';
    }
  }

  const getTrafficText = () => {
    if (!initialProduct) return '';
    const GB = initialProduct.transfer_enable;
    
    if (initialProduct.reset_traffic_method === 4) {
      return GB >= 1024 ? `${(GB / 1024).toFixed(0)}TB/Annual` : `${GB}GB/Annual`;
    }
    
    return GB >= 1024 ? `${(GB / 1024).toFixed(0)}TB/Month` : `${GB}GB/Month`;
  }

  const navigation = [
    { name: t.common.dashboard, href: '/dashboard', current: false },
    { name: t.common.product, href: '/product', current: false },
    { name: t.common.orders, href: '/orders', current: false },
  ]

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
          <dt className="text-gray-600">{t.product.order.selectedPlan}</dt>
          <dd className="font-medium text-gray-900">{initialProduct.name} ({getPeriodText()})</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-gray-600">{t.product.payment.originalPrice}</dt>
          <dd className="font-medium text-gray-900">¥{basePrice.toFixed(2)}</dd>
        </div>
        {discountValue > 0 && (
          <div className="flex items-center justify-between text-green-600">
            <dt>
              {discountType === 2
                ? `${t.product.payment.discount} (${discountValue}%)`
                : t.product.payment.discount}
            </dt>
            <dd className="font-medium">-¥{discountAmount.toFixed(2)}</dd>
          </div>
        )}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <dt className="text-lg font-medium text-gray-900">{t.product.payment.totalPayment}</dt>
          <dd className="text-xl font-semibold text-gray-900">¥{finalPrice.toFixed(2)}</dd>
        </div>
      </dl>
    )
  }

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <TitleBar 
        user={{
          name: user?.email.split('@')[0] || 'User',
          email: user?.email || '',
          imageUrl: user ? `https://www.gravatar.com/avatar/${md5(user.email)}?s=256&d=monsterid` : '/default-avatar.png'
        }} 
        navigation={navigation} 
        userNavigation={userNavigation} 
      />

      <div className="flex-1 bg-gray-50">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="md:grid md:grid-cols-2 md:gap-x-8 lg:gap-x-12">
            {/* Left side - Product Information */}
            <div className="mb-8 md:mb-0">
              <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-900/5 p-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">{t.product.order.details}</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{initialProduct.name}</h3>
                    <Content html={initialProduct.content} />
                  </div>
                  <div className="pt-4 border-t border-gray-200">
                    <div className="space-y-3">
                      {initialProduct.month_price && (
                        <div className="flex justify-between text-gray-600">
                          <span>{t.product.price.monthlyPrice}:</span>
                          <span className="font-medium">¥{initialProduct.month_price / 100}</span>
                        </div>
                      )}
                      {initialProduct.year_price && (
                        <div className="flex justify-between text-gray-600">
                          <span>{t.product.price.yearlyPrice}:</span>
                          <span className="font-medium">¥{initialProduct.year_price / 100}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - Order Summary */}
            <div>
              <div className="sticky top-8 space-y-6">
                <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-900/5">
                  {/* Billing Period Selection */}
                  <div className="p-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">{t.product.billing.period}</h2>
                    <div className="grid grid-cols-2 gap-4">
                      {initialProduct.month_price && (
                        <button
                          type="button"
                          onClick={() => setSelectedPeriod('month')}
                          className={classNames(
                            selectedPeriod === 'month' 
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-900' 
                              : 'border-gray-200 text-gray-700 hover:border-gray-300',
                            'flex flex-col items-center justify-center rounded-xl border-2 p-4 text-sm transition-colors'
                          )}
                        >
                          <span className="font-medium">{t.product.billing.monthly}</span>
                          <span className="mt-1">¥{initialProduct.month_price / 100}{t.product.billing.perMonth}</span>
                        </button>
                      )}
                      {initialProduct.quarter_price && (
                        <button
                          type="button"
                          onClick={() => setSelectedPeriod('quarter')}
                          className={classNames(
                            selectedPeriod === 'quarter' 
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-900' 
                              : 'border-gray-200 text-gray-700 hover:border-gray-300',
                            'flex flex-col items-center justify-center rounded-xl border-2 p-4 text-sm transition-colors'
                          )}
                        >
                          <span className="font-medium">{t.product.billing.perQuarter}</span>
                          <span className="mt-1">¥{initialProduct.quarter_price / 100}{t.product.billing.perQuarter}</span>
                        </button>
                      )}
                      {initialProduct.half_year_price && (
                        <button
                          type="button"
                          onClick={() => setSelectedPeriod('half_year')}
                          className={classNames(
                            selectedPeriod === 'half_year' 
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-900' 
                              : 'border-gray-200 text-gray-700 hover:border-gray-300',
                            'flex flex-col items-center justify-center rounded-xl border-2 p-4 text-sm transition-colors'
                          )}
                        >
                          <span className="font-medium">{t.product.billing.perSemiAnnual}</span>
                          <span className="mt-1">¥{initialProduct.half_year_price / 100}{t.product.billing.perSemiAnnual}</span>
                        </button>
                      )}
                      {initialProduct.year_price && (
                        <button
                          type="button"
                          onClick={() => setSelectedPeriod('year')}
                          className={classNames(
                            selectedPeriod === 'year' 
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-900' 
                              : 'border-gray-200 text-gray-700 hover:border-gray-300',
                            'flex flex-col items-center justify-center rounded-xl border-2 p-4 text-sm transition-colors'
                          )}
                        >
                          <span className="font-medium">{t.product.billing.annual}</span>
                          <span className="mt-1">¥{initialProduct.year_price / 100}{t.product.billing.perYear}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Order Summary Section */}
                  <div className="border-t border-gray-900/5 p-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">{t.product.payment.summary}</h2>
                    {renderOrderSummary()}

                    {/* Coupon Input */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <label htmlFor="coupon" className="block text-sm font-medium text-gray-700 mb-3">
                        {t.product.order.coupon.title}
                      </label>
                      <div className="flex space-x-4">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          className="block flex-1 rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          placeholder={t.product.order.coupon.placeholder}
                        />
                        <button
                          onClick={handleCheckCoupon}
                          className="rounded-lg bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 border border-gray-300"
                        >
                          {t.product.order.coupon.verify}
                        </button>
                      </div>
                      {couponError && (
                        <p className="mt-2 text-sm text-red-600">{couponError}</p>
                      )}
                    </div>

                    {/* Final Price and Confirm Button */}
                    <div className="mt-8 space-y-4">
                      <div className="flex items-center justify-between">
                        <dt className="text-lg font-medium text-gray-900">{t.product.payment.totalPayment}</dt>
                        <dd className="text-xl font-semibold text-gray-900">¥{calculatePrices().finalPrice.toFixed(2)}</dd>
                      </div>
                      <button
                        onClick={handleConfirmPayment}
                        disabled={checkingSubscription}
                        className="w-full rounded-xl bg-indigo-600 px-6 py-4 text-base font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {checkingSubscription ? t.product.payment.processing : t.product.payment.payNow}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
