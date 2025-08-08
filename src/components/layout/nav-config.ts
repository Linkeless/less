import { usePathname } from 'next/navigation'
import { useLanguage } from '@/lib/i18n/hooks'

export interface NavItemBase {
  name: string
  href: string
}

export interface NavItem extends NavItemBase {
  current: boolean
}

export function getBaseNav(t: ReturnType<typeof useLanguage>['t']): NavItemBase[] {
  return [
    { name: t.common.dashboard, href: '/dashboard' },
    { name: t.common.product, href: '/product' },
    { name: t.common.orders, href: '/orders' },
    { name: t.forwardingRules?.title || '转发规则', href: '/forwarding-rules' },
    { name: '工单', href: '/tickets' },
    { name: t.invite?.title || '邀请', href: '/invite' },
  ]
}

export function useNavItems(custom?: NavItemBase[]): NavItem[] {
  const pathname = usePathname()
  const { t } = useLanguage()

  const base = custom && custom.length > 0 ? custom : getBaseNav(t)
  const normalized = (p: string) => (p.endsWith('/') && p !== '/' ? p.slice(0, -1) : p)
  const currentPath = normalized(pathname || '/')

  return base.map(item => {
    const href = normalized(item.href)
    const isCurrent = currentPath === href || (href !== '/' && currentPath.startsWith(href + '/'))
    return { ...item, current: isCurrent }
  })
}


