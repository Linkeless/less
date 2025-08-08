'use client'

import { useEffect, useMemo, useState } from 'react'
import TitleBar from '@/components/layout/title-bar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ConfirmDialogProvider, useConfirm } from '@/components/ui/ConfirmDialog'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'
import { Badge } from '@/components/ui/badge'
import StatusBadge from '@/components/ui/status-badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useLanguage } from '@/lib/i18n/hooks'
import { getUserInfo, listUserTickets, createUserTicket, getUserTicket, getUserTicketMessages, createUserTicketMessage, closeUserTicket } from '@/lib/client'
import { hasValidToken } from '@/lib/auth-client'
import type { TicketResponse, TicketMessageResponse, UserInfo } from '@/lib/types'
import { useQueryState, parseAsString, parseAsInteger } from 'nuqs'
import { ChatBubbleLeftRightIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

function TicketsPageContent() {
  const { t } = useLanguage()
  const [user, setUser] = useState<UserInfo | null>(null)
  const [tickets, setTickets] = useState<TicketResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [needsLogin, setNeedsLogin] = useState(false)
  const ticketSchema = z.object({
    title: z.string().min(5, '标题至少 5 个字符').max(255, '标题不能超过 255 个字符'),
    category: z.enum(['general','technical','billing','account','feature','bug','subscription','payment']),
    description: z.string().min(10, '描述至少 10 个字符').max(5000, '描述不能超过 5000 个字符'),
    priority: z.enum(['low','normal','high','urgent','critical']).optional(),
    tags: z.string().max(200).optional(),
  })

  type TicketFormValues = z.infer<typeof ticketSchema>
  const form = useForm<TicketFormValues>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      title: '',
      category: 'general',
      description: '',
      priority: 'normal',
      tags: undefined,
    },
  })

  const collectSystemMetadata = (): string | undefined => {
    if (typeof window === 'undefined') return undefined
    try {
      const nav = window.navigator as any
      const scr = window.screen
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
      const data = {
        os: nav.userAgentData?.platform || nav.platform || undefined,
        browser: (nav.userAgentData?.brands && Array.isArray(nav.userAgentData.brands)
          ? nav.userAgentData.brands.map((b: any) => `${b.brand} ${b.version}`).join(', ')
          : undefined),
        user_agent: nav.userAgent,
        language: nav.language,
        languages: nav.languages,
        vendor: nav.vendor,
        screen: { width: scr?.width, height: scr?.height, dpr: window.devicePixelRatio },
        timezone: tz,
      }
      return JSON.stringify(data)
    } catch {
      return undefined
    }
  }
  // 新建工单提交中状态来自 RHF
  const [detailOpen, setDetailOpen] = useState(false)
  const [currentTicket, setCurrentTicket] = useState<TicketResponse | null>(null)
  const [messages, setMessages] = useState<TicketMessageResponse[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [reply, setReply] = useState('')
  const [replying, setReplying] = useState(false)
  const [statusFilter, setStatusFilter] = useQueryState('status', parseAsString.withDefault(''))
  const [priorityFilter, setPriorityFilter] = useQueryState('priority', parseAsString.withDefault(''))
  const [categoryFilter, setCategoryFilter] = useQueryState('category', parseAsString.withDefault(''))
  const [search, setSearch] = useQueryState('search', parseAsString.withDefault(''))
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1))
  const [limit, setLimit] = useQueryState('limit', parseAsInteger.withDefault(20))
  const [total, setTotal] = useState<number | undefined>(undefined)

  const priorityToBadgeVariant = (priority?: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch ((priority || '').toLowerCase()) {
      case 'urgent':
      case 'critical':
        return 'destructive'
      case 'high':
        return 'default'
      case 'normal':
        return 'secondary'
      case 'low':
      default:
        return 'outline'
    }
  }

  const statusLabel = (status?: string): string => {
    switch ((status || '').toLowerCase()) {
      case 'open': return '打开'
      case 'in_progress': return '处理中'
      case 'pending': return '待处理'
      case 'resolved': return '已解决'
      case 'closed': return '已关闭'
      default: return status || '-'
    }
  }

  // 顶部统计（基于当前页数据）
  const stats = useMemo(() => {
    const totalCount = tickets.length
    const openCount = tickets.filter(t => (t.status || '').toLowerCase() === 'open').length
    const workingCount = tickets.filter(t => ['in_progress', 'pending'].includes((t.status || '').toLowerCase())).length
    const closedCount = tickets.filter(t => ['closed', 'resolved'].includes((t.status || '').toLowerCase())).length
    return { totalCount, openCount, workingCount, closedCount }
  }, [tickets])

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true)
        setError(null)
        // 未登录则直接展示登录提示，避免触发受保护接口导致整页跳转
        if (!hasValidToken()) {
          setNeedsLogin(true)
          setIsLoading(false)
          return
        }
        const profile = await getUserInfo()
        if (profile.code === 0) setUser(profile.data)
        await loadList({ page: 1, limit })
      } catch (err: any) {
        setError(err?.message || '加载失败')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  const loadList = async (params?: {
    page?: number
    limit?: number
    status?: string
    priority?: string
    category?: string
    search?: string
  }) => {
    const res = await listUserTickets({
      page: params?.page ?? page,
      limit: params?.limit ?? limit,
      status: params?.status ?? (statusFilter || undefined),
      priority: params?.priority ?? (priorityFilter || undefined),
      category: params?.category ?? (categoryFilter || undefined),
      ...(params?.search ? { search: params.search } : (search ? { search } : {})),
    } as any)
    if (res.code === 0) {
      setTickets((res.data?.items as TicketResponse[]) || [])
      setTotal(res.data?.pagination?.total)
    }
  }

  useEffect(() => {
    loadList({ page, limit }).catch(() => {})
  }, [statusFilter, priorityFilter, categoryFilter, page, limit])

  const userNavigation = useMemo(() => ([
    { name: t.common.signOut, href: '/logout' },
  ]), [t])

  async function onSubmitNewTicket(values: TicketFormValues) {
    try {
      setError(null)
      const created = await createUserTicket({
        ...values,
        tags: values.tags && values.tags.trim() ? values.tags.trim() : undefined,
        metadata: collectSystemMetadata(),
      })
      if (created.code !== 0) {
        setError(created.message || '创建工单失败')
        return
      }
      await loadList({ page: 1, limit: 20 })
      form.reset({ title: '', description: '', category: 'general', priority: 'normal', tags: '' })
      setIsCreateOpen(false)
    } catch (e: any) {
      setError(e?.message || '创建工单失败')
    }
  }

  const openTicket = async (id: number) => {
    try {
      setLoadingMessages(true)
      const [detail, msg] = await Promise.all([
        getUserTicket(id),
        getUserTicketMessages(id, 1, 50),
      ])
      if (detail.code === 0) setCurrentTicket(detail.data as TicketResponse)
      if (msg.code === 0) setMessages((msg.data?.items as TicketMessageResponse[]) || [])
      setDetailOpen(true)
    } catch (e: any) {
      setError(e?.message || '加载工单失败')
    } finally {
      setLoadingMessages(false)
    }
  }

  const sendReply = async () => {
    if (!currentTicket) return
    if (!reply.trim()) return
    if ((currentTicket.status || '').toLowerCase() === 'closed') return
    try {
      setReplying(true)
      const res = await createUserTicketMessage(currentTicket.id, { content: reply.trim() })
      if (res.code !== 0) {
        setError(res.message || '发送失败')
      } else {
        const msg = await getUserTicketMessages(currentTicket.id, 1, 50)
        if (msg.code === 0) setMessages((msg.data?.items as TicketMessageResponse[]) || [])
        setReply('')
      }
    } finally {
      setReplying(false)
    }
  }

  // 去除详情中的关闭按钮，统一在表格中关闭

  // 表格内关闭工单
  const confirm = useConfirm()
  const handleCloseInTable = async (id: number) => {
    try {
      const ok = await confirm.confirm({ title: '关闭工单', message: '确定要关闭该工单吗？关闭后将无法继续回复。', confirmText: '关闭', cancelText: '取消', type: 'danger' })
      if (!ok) return
      const res = await closeUserTicket(id, {})
      if (res.code !== 0) {
        setError(res.message || '关闭失败')
        return
      }
      await loadList({ page, limit })
    } catch (e: any) {
      setError(e?.message || '关闭失败')
    }
  }

  // 不阻塞整页渲染，避免导航时“整页刷新”的观感

  // 全局滚动条与背景网格样式，参考邀请页
  const globalStyles = `
    ::-webkit-scrollbar { display: none; }
    * { -ms-overflow-style: none; scrollbar-width: none; }
  `

  return (
    <div className="min-h-[100dvh] flex flex-col bg-gray-50 dark:bg-gray-900 dark:text-gray-100 relative">
      <style jsx global>{globalStyles}</style>
      <TitleBar
        user={{
          name: user?.email?.split('@')[0] || 'User',
          email: user?.email || '',
          imageUrl: user?.avatar_url || '/default-avatar.png',
        }}
        userNavigation={userNavigation}
        showLanguageSwitch={true}
      />

      {/* 背景网格层 */}
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05] pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgb(0, 0, 0) 1px, transparent 1px), linear-gradient(90deg, rgb(0, 0, 0) 1px, transparent 1px)`,
        backgroundSize: '20px 20px'
      }} />

      <main className="flex-1 relative z-10">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {needsLogin && (
            <div className="max-w-xl mx-auto text-center py-16">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">需要登录</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">请登录后访问此页面</p>
              <div className="flex justify-center gap-3">
                <a href="/login" className="inline-flex items-center rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">登录</a>
              </div>
            </div>
          )}
          {!needsLogin && (
          <>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
            <h1 className="text-2xl font-bold">工单中心</h1>
            <div className="flex flex-1 items-center gap-2 sm:justify-end">
              <select className="rounded-md border bg-white px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}>
                <option value="">全部状态</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="pending">Pending</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
              <select className="rounded-md border bg-white px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700" value={priorityFilter} onChange={e => { setPriorityFilter(e.target.value); setPage(1) }}>
                <option value="">全部优先级</option>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
                <option value="critical">Critical</option>
              </select>
              <select className="rounded-md border bg-white px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700" value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1) }}>
                <option value="">全部类别</option>
                <option value="general">General</option>
                <option value="technical">Technical</option>
                <option value="billing">Billing</option>
                <option value="account">Account</option>
                <option value="feature">Feature</option>
                <option value="bug">Bug</option>
                <option value="subscription">Subscription</option>
                <option value="payment">Payment</option>
              </select>
              <Input placeholder="搜索标题/描述" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { setPage(1); loadList({ page: 1, limit, search: (e.target as HTMLInputElement).value }) } }} />
              <Button variant="outline" onClick={() => { setPage(1); loadList({ page: 1, limit, search }) }}>搜索</Button>
            </div>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>新建工单</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>新建工单</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form className="space-y-4" onSubmit={form.handleSubmit(onSubmitNewTicket)}>
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>标题</FormLabel>
                          <FormControl>
                            <Input placeholder="请简要概述问题" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>类别</FormLabel>
                          <FormControl>
                            <select className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700" value={field.value} onChange={field.onChange}>
                              <option value="general">通用</option>
                              <option value="technical">技术</option>
                              <option value="billing">账单</option>
                              <option value="account">账户</option>
                              <option value="feature">功能</option>
                              <option value="bug">缺陷</option>
                              <option value="subscription">订阅</option>
                              <option value="payment">支付</option>
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>优先级</FormLabel>
                          <FormControl>
                            <select className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700" value={field.value} onChange={e => field.onChange(e.target.value)}>
                              <option value="low">低</option>
                              <option value="normal">正常</option>
                              <option value="high">高</option>
                              <option value="urgent">紧急</option>
                              <option value="critical">严重</option>
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>问题描述</FormLabel>
                          <FormControl>
                            <textarea rows={6} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700" placeholder="请详细描述您遇到的问题，必要时可附上关键步骤" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="tags"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>标签（可选）</FormLabel>
                          <FormControl>
                            <Input placeholder="例如：urgent,subscription" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>取消</Button>
                      <Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? '提交中...' : '提交'}</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {/* 顶部统计卡片 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                  <ChatBubbleLeftRightIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">{stats.totalCount}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">总工单</div>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">{stats.openCount}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Open</div>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                  <ClockIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">{stats.workingCount}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">处理中</div>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <CheckCircleIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">{stats.closedCount}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">已关闭</div>
                </div>
              </div>
            </div>
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
              {isLoading && tickets.length === 0 ? (
                <div className="-mx-4 sm:-mx-6 lg:-mx-8">
                  <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                    <div className="space-y-3">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="animate-pulse rounded-lg border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-800/60 h-12" />
                      ))}
                    </div>
                  </div>
                </div>
              ) : tickets.length === 0 ? (
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
                           <th className="px-3 py-3.5 text-right text-sm font-semibold">操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {tickets.map((tk) => (
                          <tr key={tk.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="px-3 py-4 text-sm">{tk.ticket_no}</td>
                            <td className="px-3 py-4 text-sm">{tk.title}</td>
                            <td className="px-3 py-4 text-sm">
                              <StatusBadge status={tk.status} />
                            </td>
                             <td className="px-3 py-4 text-sm">
                               <Badge variant={priorityToBadgeVariant(tk.priority)} className="capitalize">{tk.priority || 'normal'}</Badge>
                             </td>
                            <td className="px-3 py-4 text-sm text-gray-500">{new Date(tk.created_at).toLocaleString()}</td>
                            <td className="px-3 py-4 text-right space-x-2">
                              <Button size="sm" variant="outline" onClick={() => window.location.assign(`/tickets/${tk.id}`)}>查看</Button>
                              <Button size="sm" variant="outline" disabled={(tk.status || '').toLowerCase() === 'closed'} onClick={() => handleCloseInTable(tk.id)}>
                                关闭
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {(total !== undefined) && (
                      <div className="mt-4 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <div>共 {total} 条</div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((page as number) - 1 <= 1 ? 1 : ((page as number) - 1))}>上一页</Button>
                          <div>第 {page} 页</div>
                          <Button variant="outline" size="sm" disabled={tickets.length < (limit as number)} onClick={() => setPage((page as number) + 1)}>下一页</Button>
                          <select className="rounded-md border bg-white px-2 py-1 text-xs dark:bg-gray-800 dark:border-gray-700" value={limit} onChange={e => { setLimit(Number(e.target.value)); setPage(1) }}>
                            <option value={10}>10/页</option>
                            <option value={20}>20/页</option>
                            <option value={50}>50/页</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 详情弹窗 */}
          <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>工单详情</DialogTitle>
              </DialogHeader>
              {!currentTicket ? (
                <div className="py-8 text-center text-gray-500">未选择工单</div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <div className="font-medium">{currentTicket.title}</div>
                      <div className="text-gray-500">工单号 {currentTicket.ticket_no}</div>
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-2">
                      状态：<StatusBadge status={currentTicket.status} />
                      {currentTicket.priority && (
                        <>
                          <span className="text-gray-400">/</span>
                          <Badge className="capitalize" variant={priorityToBadgeVariant(currentTicket.priority)}>{currentTicket.priority}</Badge>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="max-h-80 overflow-y-auto rounded-md border dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-900">
                    {loadingMessages ? (
                      <div className="py-8 text-center"><Spinner /></div>
                    ) : messages.length === 0 ? (
                      <div className="text-sm text-gray-500">暂无消息</div>
                    ) : (
                      <div className="space-y-3 text-sm">
                        {messages.map(m => (
                          <div key={m.id} className="rounded-md border dark:border-gray-700 p-2">
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>{m.user?.username || m.user?.email || '用户'}</span>
                              <span>{new Date(m.created_at).toLocaleString()}</span>
                            </div>
                            <div className="mt-1 whitespace-pre-wrap">{m.content}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Input placeholder="回复内容...（Ctrl/⌘ + Enter 发送）" value={reply} onChange={e => setReply(e.target.value)} onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') sendReply() }} disabled={(currentTicket.status || '').toLowerCase() === 'closed'} />
                    <Button onClick={sendReply} disabled={replying || (currentTicket.status || '').toLowerCase() === 'closed'}>{replying ? '发送中...' : '发送'}</Button>
                  </div>
                  {/* 在详情中不再提供关闭操作，统一在表格操作列中进行 */}
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setDetailOpen(false)}>关闭</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          </>
          )}
        </div>
      </main>
    </div>
  )
}

export default function UserTicketsPage() {
  return (
    <ConfirmDialogProvider>
      <TicketsPageContent />
    </ConfirmDialogProvider>
  )
}


