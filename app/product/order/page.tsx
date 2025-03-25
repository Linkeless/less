'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { fetchProduct, checkCoupon, fetchUserInfo, getSubscription, createOrder, getOrderDetail, getPaymentMethods } from '@/lib/api'
import TitleBar from '@/components/TitleBar'
import md5 from 'md5'

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

// Move the main content into a separate component
function OrderContent() {
  const searchParams = useSearchParams()
  const [couponCode, setCouponCode] = useState('')
  const [discount, setDiscount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [product, setProduct] = useState<{
    id: number;
    name: string;
    content: string;
    month_price: number | null;
    quarter_price: number | null;
    half_year_price: number | null;
    year_price: number | null;
    transfer_enable: number;
    reset_traffic_method: number | null;
  } | null>(null)
  const [couponError, setCouponError] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'half_year' | 'year'>('month')
  const [userInfo, setUserInfo] = useState<any>(null)
  const [loadingUserInfo, setLoadingUserInfo] = useState(true)
  const [checkingSubscription, setCheckingSubscription] = useState(false)

  useEffect(() => {
    const getProduct = async () => {
      try {
        const id = searchParams.get('id') || '50'
        const response = await fetchProduct(id)
        if (response.status === 'success') {
          setProduct(response.data)
          // Set initial period based on available prices
          if (response.data.month_price) {
            setSelectedPeriod('month')
          } else if (response.data.quarter_price) {
            setSelectedPeriod('quarter')
          } else if (response.data.half_year_price) {
            setSelectedPeriod('half_year')
          } else if (response.data.year_price) {
            setSelectedPeriod('year')
          }
        } else {
          setError(response.message || 'Failed to load product')
        }
      } catch (err) {
        setError('Failed to load product information')
      } finally {
        setLoading(false)
      }
    }
    
    getProduct()

    const fetchUserData = async () => {
      try {
        const response = await fetchUserInfo()
        setUserInfo(response.data)
      } catch (error) {
        console.error('Failed to fetch user info:', error)
      } finally {
        setLoadingUserInfo(false)
      }
    }

    fetchUserData()
  }, [searchParams])

  const handleCheckCoupon = async () => {
    try {
      setCouponError('')
      const result = await checkCoupon(couponCode)
      if (result.status === 'success' && result.data) {
        setDiscount(result.data.discount)
      } else {
        setCouponError(result.message || 'Invalid coupon code')
      }
    } catch (error) {
      setCouponError('Invalid coupon code')
    }
  }

  const handleConfirmPayment = async () => {
    try {
      setCheckingSubscription(true)
      const response = await getSubscription()
      
      if (response.data?.plan_id) {
        const confirmed = window.confirm('请注意，变更订阅会导致当前订阅被新订阅覆盖。')
        if (!confirmed) {
          return
        }
      }

      // Create order
      const period = `${selectedPeriod}_price`
      const orderResponse = await createOrder({
        period,
        plan_id: product!.id,
        coupon_code: couponCode
      })

      if (orderResponse.status === 'success' && orderResponse.data) {
        const trade_no = orderResponse.data
        // Redirect to payment page
        window.location.href = `/product/payment?trade_no=${trade_no}`
      } else {
        alert(orderResponse.message || '创建订单失败')
      }
      
    } catch (error: any) {
      console.error('Failed to process order:', error)
      if (error.message) {
        alert(error.message)
      } else {
        alert('订单处理失败，请稍后重试')
      }
    } finally {
      setCheckingSubscription(false)
    }
  }

  const getPeriodPrice = () => {
    if (!product) return 0;
    switch (selectedPeriod) {
      case 'month':
        return product.month_price || 0;
      case 'quarter':
        return product.quarter_price || 0;
      case 'half_year':
        return product.half_year_price || 0;
      case 'year':
        return product.year_price || 0;
      default:
        return 0;
    }
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
    if (!product) return '';
    const GB = product.transfer_enable;
    
    // reset_traffic_method = 4 means yearly reset
    if (product.reset_traffic_method === 4) {
      if (GB >= 1024) {
        return `${(GB / 1024).toFixed(0)}TB/Annual`;
      }
      return `${GB}GB/Annual`;
    }
    
    // Other cases show monthly
    if (GB >= 1024) {
      return `${(GB / 1024).toFixed(0)}TB/Month`;
    }
    return `${GB}GB/Month`;
  }

  const price = getPeriodPrice() / 100
  const finalPrice = price - discount

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', current: false },
    { name: 'Product', href: '/product', current: true },
    { name: 'Orders', href: '/orders', current: false },  
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

  if (loading || loadingUserInfo) {
    return (
      <div className="min-h-[100dvh] flex flex-col">
        <TitleBar user={user} navigation={navigation} userNavigation={userNavigation} />
        <div className="flex justify-center items-center flex-1">Loading...</div>
      </div>
    )
  } 

  if (error || !product) {
    return (
      <div className="min-h-[100dvh] flex flex-col">
        <TitleBar user={user} navigation={navigation} userNavigation={userNavigation} />
        <div className="flex justify-center items-center flex-1 text-red-600">{error}</div>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <TitleBar user={user} navigation={navigation} userNavigation={userNavigation} />
      <div className="flex-1 bg-gray-50">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="md:grid md:grid-cols-2 md:gap-x-8 lg:gap-x-12">
            {/* Left side - Product Information */}
            <div className="mb-8 md:mb-0">
              <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-900/5 p-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Product Details</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{product.name}</h3>
                    <Content html={product.content} />
                  </div>
                  <div className="pt-4 border-t border-gray-200">
                    <div className="space-y-3">
                      {product.month_price && (
                        <div className="flex justify-between text-gray-600">
                          <span>Monthly Price:</span>
                          <span className="font-medium">¥{product.month_price / 100}</span>
                        </div>
                      )}
                      {product.year_price && (
                        <div className="flex justify-between text-gray-600">
                          <span>Yearly Price:</span>
                          <span className="font-medium">¥{product.year_price / 100}</span>
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
                  <div className="p-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Billing Period</h2>
                    <div className="grid grid-cols-2 gap-4">
                      {product.month_price && (
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
                          <span className="font-medium">Monthly</span>
                          <span className="mt-1">¥{product.month_price / 100}/mo</span>
                        </button>
                      )}
                      {product.quarter_price && (
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
                          <span className="font-medium">Quarterly</span>
                          <span className="mt-1">¥{product.quarter_price / 100}/quarter</span>
                        </button>
                      )}
                      {product.half_year_price && (
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
                          <span className="font-medium">Semi-Annual</span>
                          <span className="mt-1">¥{product.half_year_price / 100}/6mo</span>
                        </button>
                      )}
                      {product.year_price && (
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
                          <span className="font-medium">Annual</span>
                          <span className="mt-1">¥{product.year_price / 100}/year</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-gray-900/5 p-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Summary</h2>
                    <dl className="space-y-4">
                      <div className="flex items-center justify-between">
                        <dt className="text-gray-600">Order Total</dt>
                        <dd className="font-medium">
                          <div className="text-gray-900">{product.name} {getPeriodText()}</div>
                          <div className="text-right">¥{price}</div>
                        </dd>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <dt className="text-gray-600">Traffic Package</dt>
                        <dd className="font-medium text-gray-900">{getTrafficText()}</dd>
                      </div>
                    </dl>

                    {/* Coupon Input */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <label htmlFor="coupon" className="block text-sm font-medium text-gray-700 mb-3">
                        Have a coupon?
                      </label>
                      <div className="flex space-x-4">
                        <input
                          id="coupon"
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          placeholder="Enter coupon code"
                          className="block flex-1 rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                        <button
                          type="button"
                          onClick={handleCheckCoupon}
                          className="rounded-lg bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                          Verify
                        </button>
                      </div>
                      {couponError && (
                        <p className="mt-2 text-sm text-red-600">{couponError}</p>
                      )}
                    </div>

                    {/* Final Price */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      {discount > 0 && (
                        <div className="flex items-center justify-between text-sm mb-4">
                          <dt className="text-gray-600">Discount Amount</dt>
                          <dd className="font-medium text-green-600">-¥{discount}</dd>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <dt className="text-lg font-medium text-gray-900">Total Payment</dt>
                        <dd className="text-xl font-semibold text-gray-900">¥{finalPrice}</dd>
                      </div>
                    </div>

                    {/* Confirm Button */}
                    <div className="mt-8">
                      <button
                        type="button"
                        onClick={handleConfirmPayment}
                        disabled={checkingSubscription}
                        className="w-full rounded-xl border border-transparent bg-indigo-600 px-6 py-4 text-base font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {checkingSubscription ? 'Checking...' : 'Confirm Payment'}
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

// Update the main component to include Suspense
export default function OrderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[100dvh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    }>
      <OrderContent />
    </Suspense>
  )
}
