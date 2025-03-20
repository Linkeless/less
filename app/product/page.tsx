'use client'

import { CheckIcon } from '@heroicons/react/20/solid'
import { useEffect, useState } from 'react'
import { fetchPlans } from '@/lib/api'

interface PurchasePlan {
  id: number;
  group_id: number;
  transfer_enable: number;
  name: string;
  speed_limit: number | null;
  show: number;
  sort: number;
  renew: number;
  content: string;
  month_price: number | null;
  quarter_price: number | null;
  half_year_price: number | null;
  year_price: number | null;
  two_year_price: number | null;
  three_year_price: number | null;
  onetime_price: number | null;
  reset_price: number | null;
  reset_traffic_method: number | null;
  capacity_limit: number | null;
  created_at: number;
  updated_at: number;
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

export default function Example() {
  const [plans, setPlans] = useState<PurchasePlan[]>([])
  const [periodType, setPeriodType] = useState<'monthly' | 'yearly'>('monthly')

  useEffect(() => {
    const getPlans = async () => {
      try {
        const response = await fetchPlans()
        if (response.status === 'success') {
          setPlans(response.data.filter(plan => plan.show === 1).sort((a, b) => a.sort - b.sort))
        }
      } catch (error) {
        console.error('Failed to fetch plans:', error)
      }
    }
    getPlans()
  }, [])

  const filteredPlans = plans.filter(plan => {
    if (periodType === 'monthly') {
      return plan.month_price !== null;
    } else {
      // For yearly, only show plans that have year_price but no month_price
      return plan.year_price !== null && plan.month_price === null;
    }
  });

  return (
    <div className="relative isolate bg-white px-6 py-24 sm:py-32 lg:px-8">
      <div aria-hidden="true" className="absolute inset-x-0 -top-3 -z-10 transform-gpu overflow-hidden px-36 blur-3xl">
        <div
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
          }}
          className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
        />
      </div>

      <div className="mx-auto max-w-7xl text-center">
        <h1 className="text-base font-semibold leading-7 text-indigo-600">Product List</h1>
        <div className="mt-8 flex justify-center">
          <div className="relative rounded-full p-0.5 bg-gray-200">
            <button
              onClick={() => setPeriodType('monthly')}
              className={classNames(
                periodType === 'monthly' ? 'bg-white shadow' : '',
                'px-4 py-2 rounded-full text-sm font-semibold'
              )}
            >
              Monthly billing
            </button>
            <button
              onClick={() => setPeriodType('yearly')}
              className={classNames(
                periodType === 'yearly' ? 'bg-white shadow' : '',
                'px-4 py-2 rounded-full text-sm font-semibold'
              )}
            >
              Annual billing
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-16 grid max-w-lg gap-8 lg:max-w-none lg:grid-cols-3">
        {filteredPlans.map((plan) => (
          <div
            key={plan.id}
            className="rounded-3xl p-8 ring-1 ring-gray-200 xl:p-10"
          >
            <h3 className="text-lg font-semibold leading-8 text-gray-900">
              {plan.name}
            </h3>
            <p className="mt-6 flex items-baseline gap-x-1 text-gray-900">
              <span className="text-4xl font-bold">
                ¥{periodType === 'monthly' ? 
                  (plan.month_price ? plan.month_price / 100 : 0) : 
                  (plan.year_price ? plan.year_price / 100 : 0)
                }
              </span>
              <span className="text-sm font-semibold text-gray-400">
                /{periodType === 'monthly' ? 'month' : 'year'}
              </span>
            </p>
            <Content html={plan.content} />
            <a
              href="#"
              className="mt-6 block rounded-md px-3 py-2 text-center text-sm font-semibold leading-6 bg-white text-indigo-600 ring-1 ring-inset ring-indigo-200 hover:ring-indigo-300"
            >
              Order Now
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}
