'use client';
import { Disclosure, DisclosureButton, DisclosurePanel, Menu, MenuButton, MenuItem, MenuItems, Listbox, ListboxButton, ListboxOptions, ListboxOption, Dialog, DialogPanel, DialogTitle, DialogBackdrop, Transition } from '@headlessui/react'
import { Bars3Icon, BellIcon, XMarkIcon, ChevronDownIcon, CheckIcon, ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'
import md5 from 'md5'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import type { UserInfoResponse, TrafficLog, Subscription } from '@/lib/types'
import { processTrafficData, formatBytes } from '@/lib/api'
import { 
  getUserInfo, 
  getSubscription, 
  getTrafficLog, 
  resetUUID
} from '@/lib/actions'
import { useLanguage } from '@/lib/i18n/hooks';
import TitleBar from '@/components/TitleBar'
import { useRouter } from 'next/navigation';
import SignOutButton from '@/components/SignOutButton';

const getGravatarUrl = (email: string) => {
  const hash = md5(email.trim().toLowerCase());
  return `https://www.gravatar.com/avatar/${hash}?s=256&d=monsterid`;
};

const getFilteredUrl = (token: string, nodes: Array<{id: string}>) => {
  const baseUrl = process.env.NEXT_PUBLIC_SUB_API_URL || `${window.location.protocol}//${window.location.host}`;
  let url = `${baseUrl}/service/sub?token=${token}`;
  if (nodes.length) {
    url += `&filter=${nodes.map(node => node.id).join('|')}`;
  }
  return url;
};

const formatDate = (timestamp: string | null) => {
  if (!timestamp) return 'Never';
  const date = new Date(parseInt(timestamp) * 1000);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).replace(/\//g, '-');
};

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
};

const nodeOptions = [
  { id: 'S1', name: '广港-广州入口' },
  { id: 'E1', name: '沪港-上海入口' },
  { id: 'E2', name: '沪日-上海入口' },
  { id: 'N1', name: '京港-北京入口' },
  { id: 'N2', name: '京德-北京入口' },
  { id: 'W1', name: '成港-成都入口' },
  { id: 'Special', name: '直连线路' },  
]

// Add global styles at the top
const globalStyles = `
  ::-webkit-scrollbar {
    display: none;
  }
  * {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

const formatTraffic = (value: number) => {
  if (value >= 1024 * 1024) {
    return `${(value / (1024 * 1024)).toFixed(1)}PB`;
  }
  if (value >= 1024) {
    return `${(value / 1024).toFixed(1)}TB`;
  }
  if (value < 1) {
    return `${(value * 1024).toFixed(0)}MB`;  // Removed space before MB
  }
  return `${value.toFixed(1)}GB`;  // Removed space before GB
};

const LanguageSwitch = () => {
  const { language, setLanguage } = useLanguage();
  
  return (
    <Menu as="div" className="relative ml-3">
      <MenuButton className="relative flex items-center rounded-full bg-white p-1 text-gray-400 hover:text-gray-500">
        <span className="text-sm font-medium">{language === 'zh-CN' ? '中文' : 'EN'}</span>
      </MenuButton>
      <MenuItems className="absolute right-0 z-10 mt-2 w-32 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5">
        <MenuItem>
          <button
            onClick={() => setLanguage('en')}
            className={`block w-full px-4 py-2 text-sm text-left ${language === 'en' ? 'bg-gray-100' : ''}`}
          >
            English
          </button>
        </MenuItem>
        <MenuItem>
          <button
            onClick={() => setLanguage('zh-CN')}
            className={`block w-full px-4 py-2 text-sm text-left ${language === 'zh-CN' ? 'bg-gray-100' : ''}`}
          >
            中文
          </button>
        </MenuItem>
      </MenuItems>
    </Menu>
  );
};

export default function Example() {
  const router = useRouter();
  const { t } = useLanguage();
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedNodes, setSelectedNodes] = useState<typeof nodeOptions>([])
  const [userInfo, setUserInfo] = useState<UserInfoResponse | null>(null)
  const [loadingUserInfo, setLoadingUserInfo] = useState(true)
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)
  const [showCopyNotification, setShowCopyNotification] = useState(false)
  const [showUUID, setShowUUID] = useState(false);
  const [trafficLog, setTrafficLog] = useState<TrafficLog[]>([])
  const [loadingTraffic, setLoadingTraffic] = useState(true)
  const [isMobile, setIsMobile] = useState(false);

  // Move user object inside component
  const user = {
    name: userInfo ? userInfo.data.email.split('@')[0] : 'User',
    email: userInfo ? userInfo.data.email : '',
    imageUrl: userInfo ? getGravatarUrl(userInfo.data.email) : getGravatarUrl(''),
  }

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [
          subscriptionData,
          userInfoData,
          trafficData
        ] = await Promise.all([
          getSubscription(),
          getUserInfo(),
          getTrafficLog()
        ]);

        setSubscription(subscriptionData as unknown as Subscription);
        if (userInfoData.status === 'success' && userInfoData.data) {
          setUserInfo(userInfoData as unknown as UserInfoResponse);
        }
        setTrafficLog(trafficData.data || []);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
        setLoadingUserInfo(false);
        setLoadingTraffic(false);
      }
    };

    fetchDashboardData();
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const getFilteredTrafficData = () => {
    const data = processTrafficData(trafficLog);
    if (isMobile) {
      return data.slice(-7); // 只显示最后7天的数据
    }
    return data;
  };

  const handleResetUUID = async () => {
    try {
      const response = await resetUUID();
      setUserInfo((prev) => prev ? {
        ...prev,
        data: {
          ...prev.data,
          uuid: response.data.uuid
        }
      } : null);
      setIsResetDialogOpen(false);
    } catch (error) {
      console.error('Failed to reset UUID:', error);
    }
  };

  const handleCopyUrl = async (url: string) => {
    const success = await copyToClipboard(url)
    if (success) {
      setShowCopyNotification(true)
      setTimeout(() => setShowCopyNotification(false), 2000)
    }
  }

  const navigation = [
    { name: t.common.dashboard, href: '#', current: true },
    { name: t.common.product, href: '/product', current: false },
    { name: t.common.orders, href: '/orders', current: false },
  ]

  const userNavigation = [
    { name: t.common.signOut, component: <SignOutButton /> }
  ]

  return (
    <>
      <style jsx global>{globalStyles}</style>
      <div className="min-h-[100dvh] flex flex-col">
        <TitleBar 
          user={user}
          navigation={navigation}
          userNavigation={userNavigation}
          showLanguageSwitch={true}
        />
        <main className="flex-1 flex flex-col">
          <div className="flex-1 bg-gray-50">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="relative">
                  <div className="absolute inset-px rounded-2xl bg-white"></div>
                  <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(2rem+1px)]">
                    <div className="px-8 pt-6 pb-3 sm:px-10 sm:pt-8">
                      {loading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                          <p className="mt-4 text-sm text-gray-500">{t.dashboard.traffic.loading}</p>
                        </div>
                      ) : subscription ? (
                        <div className="space-y-6">
                          <div className="flex items-center gap-3 mb-6">
                            <div className="size-16 rounded-xl bg-gradient-to-br from-indigo-50 to-white p-4 shadow-sm ring-1 ring-gray-950/5">
                              <div className="size-full bg-indigo-600 rounded-lg flex items-center justify-center">
                                <span className="text-lg font-semibold text-white">
                                  {subscription.data?.plan?.name?.[0]?.toUpperCase() || '?'}
                                </span>
                              </div>
                            </div>
                              <div className="flex-1 min-w-0">
                                <h2 className="text-xl font-semibold text-gray-900 leading-7 truncate">
                                  {subscription.data?.plan?.name || t.dashboard.subscription.noActive}
                                </h2>
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium text-gray-600">
                                    {t.dashboard.subscription.expires}: {formatDate(subscription.data.expired_at)}
                                  </p>
                                  <a 
                                    href={`/product/order?id=${subscription.data.plan_id}`}
                                    className="text-sm font-semibold text-indigo-600 hover:text-indigo-500"
                                  >
                                    {t.dashboard.subscription.renew}
                                  </a>
                                </div>
                              </div>
                          </div>

                          {subscription.data?.plan ? (
                            <div className="space-y-6">
                              <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-white p-4 shadow-sm ring-1 ring-gray-950/5">
                                <p className="text-base font-semibold text-gray-700">{t.dashboard.subscription.trafficUsage}</p>
                                <div className="mt-4">
                                  <div className="flex items-center justify-between mb-3">
                                    <span className="text-2xl font-bold text-indigo-600 tabular-nums">
                                      {formatBytes(subscription.data.u + subscription.data.d)}
                                    </span>
                                    <span className="text-2xl font-bold text-gray-900 tabular-nums">
                                      {formatBytes(subscription.data.transfer_enable)}
                                    </span>
                                  </div>
                                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                                    <div 
                                      className="h-full rounded-full bg-indigo-600 transition-all duration-300" 
                                      style={{ 
                                        width: `${Math.min(((subscription.data.u + subscription.data.d) / subscription.data.transfer_enable * 100), 100)}%` 
                                      }}
                                    />
                                  </div>
                                  <p className="mt-2 text-sm font-medium text-gray-600 text-right">
                                    {((subscription.data.u + subscription.data.d) / subscription.data.transfer_enable * 100).toFixed(1)}% {t.dashboard.subscription.used}
                                  </p>
                                </div>
                              </div>

                              <div className="rounded-xl bg-gradient-to-br from-gray-50 to-white p-4 space-y-4 shadow-sm ring-1 ring-gray-950/5">
                                <div className="space-y-2">
                                  <h3 className="text-base font-semibold text-gray-700">{t.dashboard.nodes.title}</h3>
                                  <Listbox value={selectedNodes} onChange={setSelectedNodes} multiple>
                                    {({ open }) => (
                                      <div className="relative mt-1">
                                        <ListboxButton className="relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left border focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-300 sm:text-sm">
                                          <span className="block truncate">
                                            {selectedNodes.length 
                                              ? t.dashboard.nodes.selectedCount.replace('{count}', selectedNodes.length.toString())
                                              : t.dashboard.nodes.selectRegion
                                            }
                                          </span>
                                          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                            <ChevronDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                          </span>
                                        </ListboxButton>
                                        <Transition
                                          show={open}
                                          as="div"
                                          leave="transition ease-in duration-100"
                                          leaveFrom="opacity-100"
                                          leaveTo="opacity-0"
                                        >
                                          <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                            {nodeOptions.map((node) => (
                                              <ListboxOption
                                                key={node.id}
                                                value={node}
                                                className={({ active }) =>
                                                  `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                                    active ? 'bg-indigo-100 text-indigo-900' : 'text-gray-900'
                                                  }`
                                                }
                                              >
                                                {({ selected, active }) => (
                                                  <>
                                                    <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                                      {node.name}
                                                    </span>
                                                    {selected ? (
                                                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-600">
                                                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                                      </span>
                                                    ) : null}
                                                  </>
                                                )}
                                              </ListboxOption>
                                            ))}
                                          </ListboxOptions>
                                        </Transition>
                                      </div>
                                    )}
                                  </Listbox>
                                  <p className="text-xs text-gray-500">{t.dashboard.nodes.selectHint}</p>
                                </div>
                                
                                <div className="space-y-3 pt-2">
                                  <div className="grid grid-cols-1 gap-2">
                                    {[
                                      { id: 'copy', name: t.dashboard.traffic.copyUrl, onClick: () => handleCopyUrl(getFilteredUrl(subscription.data.token, selectedNodes)) },
                                      ...(['clash', 'surge', 'shadowrocket', 'surfboard', 'quantumult-x', 'loon'] as const).map(client => ({
                                        id: client,
                                        name: client === 'quantumult-x' ? 'Quantumult X' : client.charAt(0).toUpperCase() + client.slice(1),
                                        href: (() => {
                                          const url = getFilteredUrl(subscription.data.token, selectedNodes);
                                          const clientUrls = {
                                            'clash': `clash://install-config?url=${encodeURIComponent(url + '&flag=clash')}`,
                                            'surge': `surge:///install-config?url=${encodeURIComponent(url + '&flag=surge')}`,
                                            'shadowrocket': `shadowrocket://add/sub://${btoa(url + '&flag=shadowrocket')}`,
                                            'surfboard': `surfboard:///install-config?url=${encodeURIComponent(url + '&flag=surfboard')}`,
                                            'quantumult-x': `quantumult-x:///update-configuration?remote-resource=${encodeURIComponent(url + '&flag=quantumult%20x')}`,
                                            'loon': `loon://import?url=${encodeURIComponent(url + '&flag=loon')}`
                                          };
                                          return clientUrls[client];
                                        })()
                                      }))
                                    ].map((item) => (
                                      'onClick' in item ? (
                                        <button
                                          key={item.id}
                                          onClick={item.onClick}
                                          className="flex items-center justify-center gap-1.5 px-2.5 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                        >
                                          {item.name}
                                        </button>
                                      ) : (
                                        <a
                                          key={item.id}
                                          href={item.href}
                                          className={`flex items-center justify-center gap-1.5 px-2.5 py-2 text-sm font-medium ${
                                            ['clash', 'surge', 'shadowrocket', 'surfboard', 'quantumult-x'].includes(item.id)
                                              ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                          } rounded-lg transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                            ['clash', 'surge', 'shadowrocket', 'surfboard', 'quantumult-x'].includes(item.id)
                                              ? 'focus:ring-gray-500'
                                              : 'focus:ring-gray-500'
                                          }`}
                                        >
                                          <img 
                                            src={`/${item.id === 'quantumult-x' ? 'qx' : item.id}.${item.id === 'surfboard' ? 'avif' : 'png'}`} 
                                            alt="" 
                                            className="w-4 h-4" 
                                          />
                                          <span>{item.name}</span>
                                        </a>
                                      )
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="rounded-xl bg-gradient-to-br from-gray-50 to-white p-6 text-center shadow-sm ring-1 ring-gray-950/5">
                              <p className="text-sm text-gray-500">{t.dashboard.purchase.needSubscription}</p>
                              <a href="/product" className="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                                {t.dashboard.purchase.purchaseNow}
                              </a>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <p className="text-sm text-gray-500">{t.dashboard.traffic.loadFailed}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="pointer-events-none absolute inset-px rounded-2xl ring-1 shadow-sm ring-black/5"></div>
                </div>

                <div className="relative">
                  <div className="absolute inset-px rounded-2xl bg-white"></div>
                  <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(2rem+1px)]">
                    <div className="px-8 pt-8 pb-3 sm:px-10">
                      <div className="flex items-center gap-3 mb-8">
                        <img 
                          src={userInfo ? getGravatarUrl(userInfo.data.email) : user.imageUrl} 
                          alt="" 
                          className="h-16 w-16 rounded-full ring-4 ring-gray-50" 
                        />
                        <div className="flex-1 min-w-0">
                          <h2 className="text-xl font-semibold text-gray-900 leading-7">
                            {t.dashboard.userInfo}
                          </h2>
                          <p className="text-sm font-medium text-gray-600">
                            {userInfo?.data.email}
                          </p>
                        </div>
                      </div>

                      <div className="mt-6">
                        {loadingUserInfo ? (
                          <div className="flex justify-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                          </div>
                        ) : userInfo ? (
                          <div className="space-y-6">
                            <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-white p-4 shadow-sm ring-1 ring-gray-950/5">
                              <div className="flex items-center justify-between mb-4">
                                <p className="text-base font-semibold text-gray-700">UUID</p>
                                <button
                                  onClick={() => setShowUUID(!showUUID)}
                                  className="inline-flex items-center gap-x-1.5 rounded-md bg-gradient-to-br from-indigo-50 to-white px-2.5 py-1.5 text-xs font-medium text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                >
                                  {showUUID ? t.dashboard.uuid.hide : t.dashboard.uuid.show}
                                </button>
                              </div>
                              <p className="text-base font-medium text-gray-900 tracking-wide break-all font-mono">
                                {showUUID ? userInfo.data.uuid : '••••••••-••••-••••-••••-••••••••••••'}
                              </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-white p-4 shadow-sm ring-1 ring-gray-950/5">
                                <p className="text-base font-semibold text-gray-700">{t.dashboard.balance}</p>
                                <p className="mt-2 text-2xl font-bold text-indigo-600 tabular-nums">
                                  ¥{(userInfo.data.balance / 100).toFixed(2)}
                                </p>
                              </div>
                              <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-white p-4 shadow-sm ring-1 ring-gray-950/5">
                                <p className="text-base font-semibold text-gray-700">{t.dashboard.commission}</p>
                                <p className="mt-2 text-2xl font-bold text-indigo-600 tabular-nums">
                                  ¥{(userInfo.data.commission_balance / 100).toFixed(2)}
                                </p>
                              </div>
                            </div>
                            
                            <div className="rounded-xl bg-gradient-to-br from-gray-50 to-white p-4 space-y-3 shadow-sm ring-1 ring-gray-950/5">
                              <div className="flex justify-between text-sm">
                                <span className="font-medium text-gray-600">{t.dashboard.memberSince}</span>
                                <span className="font-semibold text-gray-900">
                                  {new Date(userInfo.data.created_at * 1000).toLocaleDateString()}
                                </span>
                              </div>
                              {userInfo.data.telegram_id && (
                                <div className="flex justify-between text-sm">
                                  <span className="font-medium text-gray-600">{t.common.telegram}</span>
                                  <span className="font-semibold text-gray-900">{t.common.connected}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 text-center py-8">Failed to load user information</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="pointer-events-none absolute inset-px rounded-2xl ring-1 shadow-sm ring-black/5"></div>
                </div>

                <div className="lg:col-span-2 relative">
                  <div className="absolute inset-px rounded-2xl bg-white"></div>
                  <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(2rem+1px)]">
                    <div className="px-8 pt-6 pb-3 sm:px-10 sm:pt-8">
                      <h3 className="text-xl font-semibold text-gray-900 leading-7 mb-6">{t.dashboard.trafficStats}</h3>
                      {loadingTraffic ? (
                        <div className="flex justify-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                        </div>
                      ) : trafficLog.length > 0 ? (
                        <div className="rounded-xl bg-gradient-to-br from-gray-50 to-white p-2 shadow-sm ring-1 ring-gray-950/5">
                          <div className="h-[400px] md:h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={getFilteredTrafficData()}
                                margin={isMobile ? 
                                  { top: 10, right: 5, left: 5, bottom: 5 } : // 减少左边距
                                  { top: 10, right: 5, left: 35, bottom: 5 }
                                }
                              >
                                <CartesianGrid 
                                  strokeDasharray="3 3" 
                                  stroke="#E5E7EB" 
                                  vertical={false}
                                />
                                <XAxis 
                                  dataKey="date" 
                                  stroke="#6B7280"
                                  fontSize={isMobile ? 10 : 12}
                                  tickLine={false}
                                  axisLine={{ stroke: '#E5E7EB' }}
                                  dy={10}
                                  tick={{ transform: 'translate(0, 6)' }}
                                />
                                <YAxis 
                                  stroke="#6B7280"
                                  fontSize={isMobile ? 10 : 12}
                                  tickLine={false}
                                  axisLine={{ stroke: '#E5E7EB' }}
                                  tickFormatter={formatTraffic}
                                  width={isMobile ? 50 : 60} // 稍微减小宽度
                                  dx={-4} // 向左移动文字
                                  allowDecimals={false}
                                  tick={{ transform: 'translate(-3, 0)' }}
                                />
                                <Tooltip
                                  cursor={{ fill: '#E5E7EB', opacity: 0.1 }}
                                  contentStyle={{
                                    backgroundColor: '#ffffff',
                                    border: 'none',
                                    borderRadius: '0.75rem',
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                    padding: '0.75rem 1rem',
                                    fontSize: isMobile ? '0.75rem' : '0.875rem',
                                  }}
                                  formatter={(value: number, name: string) => [
                                    formatTraffic(value),
                                    name === 'download' ? 'Download' : 'Upload'
                                  ]}
                                  labelFormatter={(label) => `Date: ${label}`}
                                />
                                <Bar
                                  dataKey="download"
                                  fill="#6366F1"
                                  radius={[4, 4, 0, 0]}
                                  maxBarSize={isMobile ? 40 : 60}
                                />
                                <Bar
                                  dataKey="upload"
                                  fill="#34D399"
                                  radius={[4, 4, 0, 0]}
                                  maxBarSize={isMobile ? 40 : 60}
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-xl bg-gradient-to-br from-gray-50 to-white p-6 text-center shadow-sm ring-1 ring-gray-950/5">
                          <p className="text-sm text-gray-500">No traffic data available</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="pointer-events-none absolute inset-px rounded-2xl ring-1 shadow-sm ring-black/5"></div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      

      <Dialog 
        open={isResetDialogOpen} 
        onClose={() => setIsResetDialogOpen(false)}
        className="relative z-10"
      >
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-gray-500/75 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
        />

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <DialogPanel
              transition
              className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-8 sm:w-full sm:max-w-lg data-closed:sm:translate-y-0 data-closed:sm:scale-95"
            >
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full bg-yellow-100 sm:mx-0 sm:size-10">
                    <ExclamationTriangleIcon aria-hidden="true" className="size-6 text-yellow-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <DialogTitle as="h3" className="text-base font-semibold text-gray-900">
                      {t.dashboard.uuid.reset}
                    </DialogTitle>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        {t.dashboard.uuid.confirmReset}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                  type="button"
                  onClick={handleResetUUID}
                  className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 sm:ml-3 sm:w-auto"
                >
                  {t.dashboard.uuid.reset}
                </button>
                <button
                  type="button"
                  data-autofocus
                  onClick={() => setIsResetDialogOpen(false)}
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 shadow-xs ring-gray-300 ring-inset hover:bg-gray-50 sm:mt-0 sm:w-auto"
                >
                  {t.dashboard.uuid.cancel}
                </button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>

      <div 
        aria-live="assertive" 
        className="fixed bottom-4 right-4 z-50 pointer-events-none flex items-end px-4 py-6"
      >
        <Transition
          show={showCopyNotification}
          enter="transform ease-out duration-300 transition"
          enterFrom="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
          enterTo="translate-y-0 opacity-100 sm:translate-x-0"
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="rounded-lg bg-gray-900 px-4 py-3 shadow-lg">
            <div className="flex items-center space-x-2">
              <CheckIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
              <p className="text-sm font-medium text-white">
                {t.dashboard.traffic.copied}
              </p>
            </div>
          </div>
        </Transition>
      </div>
    </>
  )
}
