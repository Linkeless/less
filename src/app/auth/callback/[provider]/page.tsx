'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { handleOAuthCallback } from '@/lib/client'
import { login as saveTokenCompat, hasValidToken } from '@/lib/auth-client'

export default function OAuthCallbackPage() {
  const router = useRouter()
  const params = useParams<{ provider: string }>()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      try {
        const provider = params?.provider
        if (!provider) {
          setError('无效的登录提供商')
          return
        }

        // 如果已经有 token，直接去 dashboard
        if (hasValidToken()) {
          router.replace('/dashboard')
          return
        }

        const code = searchParams.get('code') || undefined
        const state = searchParams.get('state') || undefined

        // 向后端发起回调换取 token
        const result = await handleOAuthCallback(provider, code, state)

        // 兼容后端不同返回结构：优先 data.token.access_token
        const token: string | undefined = result?.data?.token?.access_token

        if (!token) {
          throw new Error(result?.message || '未获取到访问令牌')
        }

        // 复用账密登录的可读 cookie 方案：写入 auth_token（通过 auth-client 内部逻辑）
        // 这里调用 login 的保存逻辑并不真正发起登录请求，仅为复用 setCookie 与状态重置
        // 因为 login 方法会请求后端，这里不能调用。故直接写 cookie：
        document.cookie = `auth_token=${encodeURIComponent(token)}; path=/; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`

        router.replace('/dashboard')
      } catch (e: any) {
        console.error('OAuth 前端回调处理失败:', e)
        setError(e?.message || '登录失败，请重试')
      }
    }
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        {!error ? (
          <>
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400" />
            <p className="mt-4 text-gray-600 dark:text-gray-400">正在完成登录...</p>
          </>
        ) : (
          <>
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <a href="/login" className="mt-4 inline-block text-indigo-600 dark:text-indigo-400">返回登录</a>
          </>
        )}
      </div>
    </div>
  )
}


