'use client'

import { useEffect, useState } from 'react'
import TitleBar from '@/components/layout/title-bar'
import { useLanguage } from '@/lib/i18n/hooks'
import { adminListTickets } from '@/lib/client'
import type { TicketResponse } from '@/lib/types'

export default function AdminTicketsPage() {
  const { t } = useLanguage()
  const [tickets, setTickets] = useState<TicketResponse[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const res = await adminListTickets({ page: 1, limit: 20 })
        if (res.code === 0) {
          setTickets((res.data?.items as TicketResponse[]) || [])
        } else {
          setError(res.message || '加载失败')
        }
      } catch (e: any) {
        setError(e.message || '加载失败')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  const navigation = [
    { name: t.common.dashboard, href: '/dashboard', current: false },
    { name: t.common.orders, href: '/orders', current: false },
  ]
  const userNavigation = []

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <TitleBar
        user={{ name: 'Admin', email: '', imageUrl: '' }}
        navigation={navigation}
        userNavigation={userNavigation}
        showLanguageSwitch
      />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        <div className="bg-white dark:bg-gray-800 shadow-sm ring-1 ring-gray-900/5 dark:ring-gray-700/50 rounded-xl">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">工单列表</h2>
          </div>
          {isLoading ? (
            <div className="p-6 text-center text-gray-600 dark:text-gray-400">{t.common.loading}</div>
          ) : error ? (
            <div className="p-6 text-center text-red-600">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">工单号</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">标题</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">状态</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">优先级</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">创建时间</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {tickets.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-gray-500">暂无工单</td>
                    </tr>
                  ) : (
                    tickets.map((tk) => (
                      <tr key={tk.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{tk.ticket_no}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{tk.title}</td>
                        <td className="px-4 py-3 text-xs">
                          <span className="inline-flex rounded-md px-2 py-1 font-medium ring-1 ring-inset bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                            {tk.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{tk.priority || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{new Date(tk.created_at).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right">
                          <a className="text-indigo-600 hover:text-indigo-900" href={`/admin/tickets/${tk.id}`}>查看</a>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}


