'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import TitleBar from '@/components/layout/title-bar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Badge } from '@/components/ui/badge'
import StatusBadge from '@/components/ui/status-badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useLanguage } from '@/lib/i18n/hooks'
import { getUserInfo, getUserTicket, getUserTicketMessages, createUserTicketMessage, closeUserTicket } from '@/lib/client'
import type { TicketResponse, TicketMessageResponse, UserInfo } from '@/lib/types'

export default function TicketDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { t } = useLanguage()

  const [user, setUser] = useState<UserInfo | null>(null)
  const [ticket, setTicket] = useState<TicketResponse | null>(null)
  const [messages, setMessages] = useState<TicketMessageResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [reply, setReply] = useState('')
  const [replying, setReplying] = useState(false)
  const [closing, setClosing] = useState(false)

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

  const userNavigation = useMemo(() => ([{ name: t.common.signOut, href: '/logout' }]), [t])

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const profile = await getUserInfo()
        if (profile.code === 0) setUser(profile.data)
        const idNum = Number(params.id)
        const [detail, msg] = await Promise.all([
          getUserTicket(idNum),
          getUserTicketMessages(idNum, 1, 100),
        ])
        if (detail.code === 0) setTicket(detail.data as TicketResponse)
        if (msg.code === 0) setMessages((msg.data?.items as TicketMessageResponse[]) || [])
      } catch (e: any) {
        setError(e?.message || '加载失败')
      } finally {
        setIsLoading(false)
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  const sendReply = async () => {
    if (!ticket) return
    if (!reply.trim()) return
    if ((ticket.status || '').toLowerCase() === 'closed') return
    try {
      setReplying(true)
      const res = await createUserTicketMessage(ticket.id, { content: reply.trim() })
      if (res.code !== 0) {
        setError(res.message || '发送失败')
      } else {
        const msg = await getUserTicketMessages(ticket.id, 1, 100)
        if (msg.code === 0) setMessages((msg.data?.items as TicketMessageResponse[]) || [])
        setReply('')
      }
    } finally {
      setReplying(false)
    }
  }

  const closeTicket = async () => {
    if (!ticket) return
    try {
      setClosing(true)
      const res = await closeUserTicket(ticket.id, {})
      if (res.code !== 0) setError(res.message || '关闭失败')
      const detail = await getUserTicket(ticket.id)
      if (detail.code === 0) setTicket(detail.data as TicketResponse)
    } finally {
      setClosing(false)
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
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-4 flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push('/tickets')}>返回列表</Button>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!ticket ? (
            <div className="py-10 text-center text-gray-500">未找到工单</div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>工单 #{ticket.ticket_no}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-lg font-medium">{ticket.title}</div>
                    <div className="text-sm text-gray-500">创建于 {new Date(ticket.created_at).toLocaleString()}</div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <StatusBadge status={ticket.status} />
                    {ticket.priority && <Badge variant={priorityToBadgeVariant(ticket.priority)} className="capitalize">{ticket.priority}</Badge>}
                  </div>
                </div>

                <div className="max-h-[60vh] overflow-y-auto rounded-md border dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-900">
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

                <div className="mt-3 flex gap-2">
                  <Input placeholder="回复内容...（Ctrl/⌘ + Enter 发送）" value={reply} onChange={e => setReply(e.target.value)} onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') sendReply() }} />
                  <Button onClick={sendReply} disabled={replying || (ticket.status || '').toLowerCase() === 'closed'}>{replying ? '发送中...' : '发送'}</Button>
                  <Button variant="outline" onClick={closeTicket} disabled={closing || (ticket.status || '').toLowerCase() === 'closed'}>{closing ? '关闭中...' : '关闭工单'}</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}


