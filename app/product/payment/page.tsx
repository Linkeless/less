'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { fetchUserInfo, getOrderDetail, getPaymentMethods, checkout } from '@/lib/api'
import TitleBar from '@/components/TitleBar'
import md5 from 'md5'

// Add Content component
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

interface PaymentMethod {
  id: number
  name: string
  handling_fee_percent: number
}

// Update OrderDetail interface to match API response
interface OrderDetail {
  id: number;
  trade_no: string;
  total_amount: number;
  discount_amount: number | null;
  balance_amount: number;
  period: string;
  status: number;
  paid_at: number;
  created_at: number;
  plan: {
    name: string;
    transfer_enable: number;
    content: string;
    month_price: number;
    quarter_price: number;
    half_year_price: number;
    year_price: number;
  };
}

export default function PaymentPage() {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null)
  const [userInfo, setUserInfo] = useState<any>(null)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [selectedMethod, setSelectedMethod] = useState<number | null>(null)
  const [processingPayment, setProcessingPayment] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const tradeNo = searchParams.get('trade_no')
        if (!tradeNo) {
          throw new Error('Invalid order number')
        }

        // Fetch order details
        const orderResponse = await getOrderDetail(tradeNo)
        if (orderResponse.status === 'success') {
          setOrderDetail(orderResponse.data)
        }

        // Fetch payment methods
        const methodsResponse = await getPaymentMethods()
        if (methodsResponse.status === 'success') {
          setPaymentMethods(methodsResponse.data)
          if (methodsResponse.data.length > 0) {
            setSelectedMethod(methodsResponse.data[0].id)
          }
        }

        // Fetch user info
        const userResponse = await fetchUserInfo()
        if (userResponse.status === 'success') {
          setUserInfo(userResponse.data)
        }

      } catch (err: any) {
        setError(err.message || 'Failed to load payment information')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [searchParams])

  const handlePayment = async () => {
    if (!selectedMethod || !orderDetail) return

    try {
      setProcessingPayment(true)
      const response = await checkout(orderDetail.trade_no, selectedMethod)
      
      if (response.type === -1) {
        // Balance payment successful
        alert('Balance payment successful')
        window.location.href = '/dashboard'
      } 
      else if (response.type === 1) {
        // Redirect to third-party payment URL
        window.location.href = response.data
      }
      else if (response.type === 0) {
        // Redirect to payment page
        window.location.href = `/product/pay?trade_no=${orderDetail.trade_no}&method=${selectedMethod}`
      } else {
        throw new Error('Payment processing failed')
      }
    } catch (err: any) {
      alert(err.message || 'Payment processing failed')
    } finally {
      setProcessingPayment(false)
    }
  }

  const getPlanPrice = () => {
    if (!orderDetail) return 0;
    switch (orderDetail.period) {
      case 'month_price':
        return orderDetail.plan.month_price;
      case 'quarter_price':
        return orderDetail.plan.quarter_price;
      case 'half_year_price':
        return orderDetail.plan.half_year_price;
      case 'year_price':
        return orderDetail.plan.year_price;
      default:
        return 0;
    }
  };
  
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

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex flex-col">
        <TitleBar user={user} navigation={navigation} userNavigation={userNavigation} />
        <div className="flex justify-center items-center flex-1">Loading...</div>
      </div>
    )
  }

  if (error || !orderDetail) {
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
            {/* Left side - Payment Information */}
            <div className="mb-8 md:mb-0 space-y-6">
              <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-900/5 p-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Product Information</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{orderDetail.plan.name}</h3>
                    <Content html={orderDetail.plan.content} />
                  </div>
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex justify-between text-gray-600">
                      <span>Traffic Package:</span>
                      <span className="font-medium">
                        {orderDetail.plan.transfer_enable >= 1024 
                          ? `${(orderDetail.plan.transfer_enable / 1024).toFixed(0)}TB` 
                          : `${orderDetail.plan.transfer_enable}GB`
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-900/5 p-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Payment Methods</h2>
                <div className="space-y-4">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      onClick={() => setSelectedMethod(method.id)}
                      className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                        selectedMethod === method.id
                          ? 'border-indigo-600 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="font-medium text-gray-900">{method.name}</span>
                      {method.handling_fee_percent > 0 && (
                        <span className="text-sm text-gray-500">
                          +{method.handling_fee_percent}% fee
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right side - Order Summary */}
            <div>
              <div className="sticky top-8">
                <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-900/5">
                  <div className="p-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Summary</h2>
                    <dl className="space-y-4">
                      <div className="flex items-center justify-between">
                        <dt className="text-gray-600">Order Number</dt>
                        <dd className="font-mono text-gray-900">{orderDetail.trade_no}</dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt className="text-gray-600">Created Time</dt>
                        <dd className="font-medium text-gray-900">
                          {new Date(orderDetail.created_at * 1000).toLocaleString()}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt className="text-gray-600">Period</dt>
                        <dd className="font-medium text-gray-900">
                          {orderDetail.period === 'month_price' && 'Monthly'}
                          {orderDetail.period === 'quarter_price' && 'Quarterly'}
                          {orderDetail.period === 'half_year_price' && 'Semi-Annual'}
                          {orderDetail.period === 'year_price' && 'Annual'}
                        </dd>
                      </div>
                      <div className="pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <dt className="text-gray-600">Subtotal</dt>
                          <dd className="font-medium text-gray-900">
                            ¥{getPlanPrice() / 100}
                          </dd>
                        </div>
                        {orderDetail.discount_amount && orderDetail.discount_amount > 0 && (
                          <div className="flex items-center justify-between mt-2">
                            <dt className="text-gray-600">Discount</dt>
                            <dd className="font-medium text-green-600">-¥{orderDetail.discount_amount / 100}</dd>
                          </div>
                        )}
                        {orderDetail.balance_amount > 0 && (
                          <div className="flex items-center justify-between mt-2">
                            <dt className="text-gray-600">Balance Payment</dt>
                            <dd className="font-medium text-blue-600">¥{orderDetail.balance_amount / 100}</dd>
                          </div>
                        )}
                      </div>
                    </dl>
                  </div>

                  <div className="border-t border-gray-900/5 p-8">
                    <div className="flex items-center justify-between mb-8">
                      <dt className="text-lg font-medium text-gray-900">Total Payment</dt>
                      <dd className="text-xl font-semibold text-gray-900">
                        ¥{orderDetail.total_amount / 100}
                      </dd>
                    </div>

                    <button
                      type="button"
                      onClick={handlePayment}
                      disabled={!selectedMethod || processingPayment}
                      className="w-full rounded-xl border border-transparent bg-indigo-600 px-6 py-4 text-base font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processingPayment ? 'Processing...' : 'Pay Now'}
                    </button>
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
