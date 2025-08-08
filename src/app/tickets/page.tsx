'use client'

import { useEffect, useMemo, useState } from 'react'
import TitleBar from '@/components/layout/title-bar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useLanguage } from '@/lib/i18n/hooks'
import { getUserInfo } from '@/lib/client'
import type { TicketResponse, UserInfo } from '@/lib/types'

export default function UserTicketsPage() {
  const { t } = useLanguage()
  const [user, setUser] = useState<UserInfo | null>(null)
  const [tickets, setTickets] = useState<TicketResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('general')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const profile = await getUserInfo()
        if (profile.code === 0) setUser(profile.data)

        // 工单用户端API未在swagger中定义，这里仅渲染空列表占位
        setTickets([])
      } catch (err: any) {
        setError(err?.message || '加载失败')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  const userNavigation = useMemo(() => ([
    { name: t.common.signOut, href: '/logout' },
  ]), [t])

  const handleCreate = async () => {
    try {
      setSubmitting(true)
      // 暂无用户端工单创建API，这里仅做前端校验与提示
      if (!title.trim() || !description.trim()) {
        setError('请填写标题与问题描述')
        return
      }
      setError('当前版本未提供用户工单创建接口，请联系管理员或稍后再试。')
    } finally {
      setSubmitting(false)
      setIsCreateOpen(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">{t.common.loading}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] flex flex-col dark:bg-gray-900 dark:text-gray-100">
      <TitleBar
        user={{
          name: user?.email?.split('@')[0] || 'User',
          email: user?.email || '',
          imageUrl: user?.avatar_url || '/default-avatar.png',
        }}
        userNavigation={userNavigation}
        showLanguageSwitch={true}
      />

      <main className="flex-1 bg-gray-50 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">工单中心</h1>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>新建工单</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>新建工单</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="ticket-title">标题</Label>
                    <Input id="ticket-title" value={title} onChange={e => setTitle(e.target.value)} placeholder="请简要概述问题" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ticket-category">类别</Label>
                    <select id="ticket-category" className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700" value={category} onChange={e => setCategory(e.target.value)}>
                      <option value="general">通用</option>
                      <option value="technical">技术</option>
                      <option value="billing">账单</option>
                      <option value="subscription">订阅</option>
                      <option value="payment">支付</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ticket-description">问题描述</Label>
                    <textarea id="ticket-description" value={description} onChange={e => setDescription(e.target.value)} rows={6} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700" placeholder="请详细描述您遇到的问题，必要时可附上关键步骤" />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>取消</Button>
                  <Button onClick={handleCreate} disabled={submitting}>{submitting ? '提交中...' : '提交'}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>我的工单</CardTitle>
            </CardHeader>
            <CardContent>
              {tickets.length === 0 ? (
                <div className="py-10 text-center text-gray-500">暂无工单</div>
              ) : (
                <div className="overflow-x-auto -mx-4 sm:-mx-6 lg:-mx-8">
                  <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead>
                        <tr>
                          <th className="px-3 py-3.5 text-left text-sm font-semibold">工单号</th>
                          <th className="px-3 py-3.5 text-left text-sm font-semibold">标题</th>
                          <th className="px-3 py-3.5 text-left text-sm font-semibold">状态</th>
                          <th className="px-3 py-3.5 text-left text-sm font-semibold">优先级</th>
                          <th className="px-3 py-3.5 text-left text-sm font-semibold">创建时间</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {tickets.map((tk) => (
                          <tr key={tk.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="px-3 py-4 text-sm">{tk.ticket_no}</td>
                            <td className="px-3 py-4 text-sm">{tk.title}</td>
                            <td className="px-3 py-4 text-sm">
                              <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700">
                                {tk.status}
                              </span>
                            </td>
                            <td className="px-3 py-4 text-sm">{tk.priority || 'normal'}</td>
                            <td className="px-3 py-4 text-sm text-gray-500">{new Date(tk.created_at).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}


