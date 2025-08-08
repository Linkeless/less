'use client'

import { useState } from 'react'
import md5 from 'md5'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { checkout } from '@/lib/client'
import TitleBar from '@/components/layout/title-bar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Spinner } from '@/components/ui/spinner'
import type { UserInfo } from '@/lib/types'
import { useLanguage } from '@/lib/i18n/hooks';
import { cn } from '@/lib/utils'

interface PaymentFormProps {
  initialOrder: {
    id: number;
    trade_no?: string;
    payment_no?: string;
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

const formSchema = z.object({
  paymentMethod: z.number().min(1, "请选择支付方式"),
})

export default function PaymentForm({ initialOrder, paymentMethods, user }: PaymentFormProps) {
  const { t } = useLanguage();
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string>('');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      paymentMethod: paymentMethods.length > 0 ? paymentMethods[0].id : 0,
    },
  })

  const selectedMethodId = form.watch('paymentMethod')

  const userNavigation = [
    { 
      name: t.common.signOut, 
      onClick: () => {
        localStorage.clear();
        // 破坏性修改：不再自动跳转到登录页
        console.warn('用户未登录，但不再自动跳转');
      }
    },
  ];

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setProcessingPayment(true);
      setPaymentError('');
      
      const paymentNo = initialOrder.payment_no || initialOrder.trade_no;
      if (!paymentNo) {
        throw new Error('订单号缺失');
      }

      const response = await checkout(paymentNo, values.paymentMethod);
      
      if (response.type === -1) {
        alert('余额支付成功');
        window.location.href = '/dashboard';
      } 
      else if (response.type === 1) {
        window.location.href = response.data;
      }
      else if (response.type === 0) {
        window.location.href = `/product/pay?payment_no=${paymentNo}&method=${values.paymentMethod}`;
      } else {
        throw new Error('支付处理失败');
      }
    } catch (err: any) {
      setPaymentError(err.message || '支付处理失败');
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
        userNavigation={userNavigation} 
      />

      <div className="flex-1 bg-gray-50 dark:bg-gray-900">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="md:grid md:grid-cols-2 md:gap-x-8 lg:gap-x-12">
            {/* Product Information */}
            <div className="mb-8 md:mb-0">
              <Card>
                <CardHeader>
                  <CardTitle>{t.product.order.details}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
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
                          <Badge variant="secondary" className="text-green-600 dark:text-green-400">{t.product.order.unlimited}</Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payment Methods and Summary */}
            <div>
              <div className="sticky top-8 space-y-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>{t.product.payment.methods}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <FormField
                          control={form.control}
                          name="paymentMethod"
                          render={({ field }) => (
                            <FormItem className="space-y-3">
                              <FormControl>
                                <RadioGroup
                                  onValueChange={(value) => field.onChange(parseInt(value))}
                                  defaultValue={field.value.toString()}
                                  className="space-y-4"
                                >
                                  {paymentMethods.map((method) => (
                                    <FormItem key={method.id}>
                                      <FormControl>
                                        <RadioGroupItem 
                                          value={method.id.toString()} 
                                          id={method.id.toString()}
                                          className="peer sr-only"
                                        />
                                      </FormControl>
                                      <Label
                                        htmlFor={method.id.toString()}
                                        className={cn(
                                          "relative flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-colors",
                                          "peer-checked:border-indigo-600 peer-checked:bg-indigo-50 peer-checked:dark:border-indigo-400 peer-checked:dark:bg-indigo-900/50",
                                          "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                                        )}
                                      >
                                        <div className="flex flex-col">
                                          <span className="font-medium text-gray-900 dark:text-gray-100">
                                            {method.name}
                                          </span>
                                          {method.handling_fee_percent > 0 && (
                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                              {t.product.payment.fee.replace('{percent}', method.handling_fee_percent.toString())}
                                            </span>
                                          )}
                                        </div>
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
                              <dt className="text-gray-600 dark:text-gray-400">{t.product.payment.balance}</dt>
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
                          
                          {paymentError && (
                            <Alert variant="destructive">
                              <AlertDescription>{paymentError}</AlertDescription>
                            </Alert>
                          )}

                          <Button
                            type="submit"
                            disabled={!selectedMethodId || processingPayment}
                            className="w-full"
                            size="lg"
                          >
                            {processingPayment && <Spinner size="sm" className="mr-2" />}
                            {processingPayment ? t.product.payment.processing : t.product.payment.payNow}
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
  );
}
