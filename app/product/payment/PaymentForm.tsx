'use client'

import { useState } from 'react'
import md5 from 'md5'
import { RadioGroup } from '@headlessui/react'
import { verifyPayment } from '@/lib/actions'
import TitleBar from '@/components/TitleBar'
import type { UserInfo } from '@/lib/types'
import { useLanguage } from '@/lib/i18n/hooks';

interface PaymentFormProps {
  initialOrder: {
    id: number;
    trade_no: string;
    total_amount: number;
    discount_amount: number | null;
    balance_amount: number;
    period: string;
    is_onetime?: boolean;
    plan: {
      name: string;
      content: string;
      transfer_enable: number;
      onetime_price?: number | null;
    };
  };
  paymentMethods: Array<{
    id: number;
    name: string;
    icon: string;
    handling_fee_percent: number;
  }>;
  user: UserInfo | null;
}

function Content({ html }: { html: string }) {
  return (
    <div 
      className="mt-4 [&_.t4]:mb-4 [&_.tit]:font-medium [&_.tit]:text-gray-900 dark:[&_.tit]:text-gray-100 [&_.desc]:mt-2 [&_.desc]:text-gray-600 dark:[&_.desc]:text-gray-400 [&_i.gou]:mr-2 [&_i.gou]:inline-block [&_i.gou]:h-4 [&_i.gou]:w-4 [&_i.gou]:rounded-full [&_i.gou]:bg-blue-50 dark:[&_i.gou]:bg-blue-900/50 [&_i.gou]:text-blue-500 dark:[&_i.gou]:text-blue-300 [&_i.gou:before]:content-['✓']" 
      dangerouslySetInnerHTML={{ __html: html }} 
    />
  );
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function PaymentForm({ initialOrder, paymentMethods, user }: PaymentFormProps) {
  const { t } = useLanguage();
  const [selectedMethod, setSelectedMethod] = useState<number | null>(
    paymentMethods.length > 0 ? paymentMethods[0].id : null
  );
  const [processingPayment, setProcessingPayment] = useState(false);

  const navigation = [
    { name: t.common.dashboard, href: '/dashboard', current: false },
    { name: t.common.product, href: '/product', current: false },
    { name: t.common.orders, href: '/orders', current: false },
  ];

  const userNavigation = [
    { 
      name: t.common.signOut, 
      onClick: () => {
        localStorage.clear();
        window.location.href = '/login';
      }
    },
  ];

  const handlePayment = async () => {
    if (!selectedMethod) return;

    try {
      setProcessingPayment(true);
      const response = await verifyPayment(initialOrder.trade_no, selectedMethod);
      
      if (response.type === -1) {
        alert('余额支付成功');
        window.location.href = '/dashboard';
      } 
      else if (response.type === 1) {
        window.location.href = response.data;
      }
      else if (response.type === 0) {
        window.location.href = `/product/pay?trade_no=${initialOrder.trade_no}&method=${selectedMethod}`;
      } else {
        throw new Error('支付处理失败');
      }
    } catch (err: any) {
      alert(err.message || '支付处理失败');
    } finally {
      setProcessingPayment(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col dark:bg-gray-900 dark:text-gray-100">
      <TitleBar 
        user={{
          name: user?.email.split('@')[0] || 'User',
          email: user?.email || '',
          imageUrl: user ? `https://www.gravatar.com/avatar/${md5(user.email)}?s=256&d=monsterid` : '/default-avatar.png'
        }} 
        navigation={navigation} 
        userNavigation={userNavigation} 
      />

      <div className="flex-1 bg-gray-50 dark:bg-gray-900">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="md:grid md:grid-cols-2 md:gap-x-8 lg:gap-x-12">
            {/* Product Information */}
            <div className="mb-8 md:mb-0">
              <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-sm ring-1 ring-gray-900/5 dark:ring-gray-700 p-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">{t.product.order.details}</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{initialOrder.plan.name}</h3>
                    <Content html={initialOrder.plan.content} />
                  </div>
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="space-y-3">
                      <div className="flex justify-between text-gray-600 dark:text-gray-400">
                        <span>{t.product.order.traffic}:</span>
                        <span className="font-medium">
                          {initialOrder.plan.transfer_enable >= 1024 
                            ? `${(initialOrder.plan.transfer_enable / 1024).toFixed(0)}TB` 
                            : `${initialOrder.plan.transfer_enable}GB`
                          }
                          {initialOrder.period === 'onetime_price' || initialOrder.is_onetime 
                            ? `/${t.product.billing.oneTime}` 
                            : initialOrder.period === 'year_price' 
                              ? `/${t.product.billing.perYear}` 
                              : `/${t.product.billing.perMonth}`
                          }
                        </span>
                      </div>
                      {/* 显示付款类型 */}
                      <div className="flex justify-between text-gray-600 dark:text-gray-400">
                        <span>{t.product.billing.period}:</span>
                        <span className="font-medium">
                          {initialOrder.period === 'onetime_price' || initialOrder.is_onetime 
                            ? t.product.billing.oneTime
                            : initialOrder.period === 'month_price' 
                              ? t.product.billing.monthly
                              : initialOrder.period === 'quarter_price'
                                ? t.product.billing.quarterly
                                : initialOrder.period === 'half_year_price'
                                  ? t.product.billing.semiAnnual
                                  : t.product.billing.annual
                          }
                        </span>
                      </div>
                      {/* 对于一次性订单，显示无限期标记 */}
                      {(initialOrder.period === 'onetime_price' || initialOrder.is_onetime || initialOrder.plan.onetime_price) && (
                        <div className="flex justify-between text-gray-600 dark:text-gray-400">
                          <span>{t.product.order.duration}:</span>
                          <span className="font-medium text-green-600 dark:text-green-400">{t.product.order.unlimited}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Methods and Summary */}
            <div>
              <div className="sticky top-8 space-y-6">
                <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-sm ring-1 ring-gray-900/5 dark:ring-gray-700">
                  <div className="p-8">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">{t.product.payment.methods}</h2>
                    <RadioGroup value={selectedMethod} onChange={setSelectedMethod}>
                      <RadioGroup.Label className="sr-only">支付方式</RadioGroup.Label>
                      <div className="space-y-4">
                        {paymentMethods.map((method) => (
                          <RadioGroup.Option
                            key={method.id}
                            value={method.id}
                            className={({ checked }) =>
                              classNames(
                                'relative flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-colors',
                                checked
                                  ? 'border-indigo-600 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-900'
                                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                              )
                            }
                          >
                            {({ checked }) => (
                              <>
                                <RadioGroup.Label as="span" className="font-medium text-gray-900 dark:text-gray-100">
                                  {method.name}
                                </RadioGroup.Label>
                                {method.handling_fee_percent > 0 && (
                                  <RadioGroup.Description as="span" className="text-sm text-gray-500 dark:text-gray-400">
                                    {t.product.payment.fee.replace('{percent}', method.handling_fee_percent.toString())}
                                  </RadioGroup.Description>
                                )}
                              </>
                            )}
                          </RadioGroup.Option>
                        ))}
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="border-t border-gray-900/5 dark:border-gray-700 p-8">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">{t.product.payment.summary}</h2>
                    <dl className="space-y-4">
                      {initialOrder.discount_amount && initialOrder.discount_amount > 0 && (
                        <div className="flex items-center justify-between">
                          <dt className="text-gray-600 dark:text-gray-400">{t.product.payment.discount}</dt>
                          <dd className="font-medium text-green-600 dark:text-green-400">
                            -¥{initialOrder.discount_amount / 100}
                          </dd>
                        </div>
                      )}
                      {initialOrder.balance_amount > 0 && (
                        <div className="flex items-center justify-between">
                          <dt className="text-gray-600 dark:text-gray-400">{t.product.payment.summary}</dt>
                          <dd className="font-medium text-blue-600 dark:text-blue-400">
                            ¥{initialOrder.balance_amount / 100}
                          </dd>
                        </div>
                      )}
                    </dl>

                    <div className="mt-8 space-y-4">
                      <div className="flex items-center justify-between">
                        <dt className="text-lg font-medium text-gray-900 dark:text-gray-100">{t.product.payment.totalPayment}</dt>
                        <dd className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                          ¥{initialOrder.total_amount / 100}
                        </dd>
                      </div>
                      <button
                        onClick={handlePayment}
                        disabled={!selectedMethod || processingPayment}
                        className="w-full rounded-xl bg-indigo-600 dark:bg-indigo-400 px-6 py-4 text-base font-semibold text-white shadow-sm hover:bg-indigo-700 dark:hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {processingPayment ? t.product.payment.processing : t.product.payment.payNow}
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
  );
}
