'use client'

import { useState, useEffect } from 'react'
import { ThemeProvider } from 'next-themes'
import { LanguageProvider } from '@/lib/i18n/context'

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <LanguageProvider>
        {children}
      </LanguageProvider>
    </ThemeProvider>
  )
}
