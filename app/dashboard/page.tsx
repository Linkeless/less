'use client';
import { Disclosure, DisclosureButton, DisclosurePanel, Menu, MenuButton, MenuItem, MenuItems, Listbox, ListboxButton, ListboxOptions, ListboxOption, Dialog, DialogPanel, DialogTitle, DialogBackdrop, Transition } from '@headlessui/react'
import { Bars3Icon, BellIcon, XMarkIcon, ChevronDownIcon, CheckIcon, ExclamationTriangleIcon, ArrowPathIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'
import { useEffect, useState, Fragment } from 'react'
import md5 from 'md5'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import type { UserInfoResponse, TrafficLog, Subscription } from '@/lib/types'
import { processTrafficData, formatBytes } from '@/lib/api'
import { 
  getUserInfo, 
  getSubscription, 
  getTrafficLog, 
  resetUUID,
  getUserNotices
} from '@/lib/actions'
import { useLanguage } from '@/lib/i18n/hooks';
import TitleBar from '@/components/TitleBar'
import { useRouter } from 'next/navigation';
import SignOutButton from '@/components/SignOutButton';
import { Dialog as HeadlessDialog, Transition as HeadlessTransition } from '@headlessui/react';

const getGravatarUrl = (email: string) => {
  const hash = md5(email.trim().toLowerCase());
  return `https://www.gravatar.com/avatar/${hash}?s=256&d=monsterid`;
};

const getFilteredUrl = (token: string, node: {id: number} | null, protocols: Array<{id: string}>) => {
  const baseUrl = process.env.NEXT_PUBLIC_SUB_API_URL || `${window.location.protocol}//${window.location.host}`;
  let url = `${baseUrl}/service/sub?token=${token}`;
  if (node) {
    url += `&inbound=${node.id}`;
  }
  // Only add ss2022=true parameter when ss2022 is selected
  if (protocols.some(p => p.id === 'ss2022')) {
    url += '&ss2022=true';
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
  { id: 1, name: '广州' },
  { id: 2, name: '上海' },
  { id: 3, name: '北京' },
  { id: 4, name: '成都' },
  // 如有更多节点，继续添加
]

const protocolOptions = [
  { id: 'ss', name: 'Shadowsocks' },
  { id: 'ss2022', name: 'SS-2022' }
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

export default function Dashboard() {
  const router = useRouter();
  const { t } = useLanguage();
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedNode, setSelectedNode] = useState<typeof nodeOptions[0] | null>(null)
  const [selectedProtocol, setSelectedProtocol] = useState(protocolOptions[0])
  const [userInfo, setUserInfo] = useState<UserInfoResponse | null>(null)
  const [loadingUserInfo, setLoadingUserInfo] = useState(true)
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)
  const [showCopyNotification, setShowCopyNotification] = useState(false)
  const [showUUID, setShowUUID] = useState(false);
  const [trafficLog, setTrafficLog] = useState<TrafficLog[]>([])
  const [loadingTraffic, setLoadingTraffic] = useState(true)
  const [isMobile, setIsMobile] = useState(false);
  const [notices, setNotices] = useState<any[]>([]);
  const [showNotices, setShowNotices] = useState(false);
  const [showPopupNotice, setShowPopupNotice] = useState(false);
  const [popupNotice, setPopupNotice] = useState<any | null>(null);

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
          trafficData,
          noticesData
        ] = await Promise.all([
          getSubscription(),
          getUserInfo(),
          getTrafficLog(),
          getUserNotices(),
        ]);

        setSubscription(subscriptionData as unknown as Subscription);
        if (userInfoData.status === 'success' && userInfoData.data) {
          setUserInfo(userInfoData as unknown as UserInfoResponse);
        }
        setTrafficLog(trafficData.data || []);
        setNotices(noticesData.data || []);
        // 检查是否有 tags 包含"弹窗"的通知
        if (noticesData.data && Array.isArray(noticesData.data)) {
          const popup = noticesData.data.find((n: any) => Array.isArray(n.tags) && n.tags.includes('弹窗'));
          if (popup) {
            setPopupNotice(popup);
            setShowPopupNotice(true);
          }
        }
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
    { name: t.invite.title, href: '/invite', current: false },
  ]

  const userNavigation = [
    { name: t.common.signOut, component: <SignOutButton /> }
  ]

  return (
    <>
      <style jsx global>{globalStyles}</style>
      <div className="min-h-[100dvh] flex flex-col bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
        <div className="relative isolate">
          {/* Background Gradient */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
          >
            <div
              style={{
                clipPath:
                  'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
              }}
              className="relative left-[calc(50%-11rem)] aspect-1155/678 w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
            />
          </div>

          <TitleBar 
            user={user}
            navigation={navigation}
            userNavigation={userNavigation}
            showLanguageSwitch={true}
            rightExtra={
              <button
                className="relative rounded-full p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200"
                onClick={() => setShowNotices(true)}
                aria-label="查看通知"
              >
                <BellIcon className="size-5" />
                {notices.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex size-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full size-3 bg-yellow-500"></span>
                  </span>
                )}
              </button>
            }
          />

          <main className="flex-1">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Subscription Card */}
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative flex h-full flex-col overflow-hidden rounded-2xl bg-white dark:bg-gray-800">
                    <div className="px-8 pt-6 pb-3 sm:px-10 sm:pt-8">
                      {loading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
                          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">{t.dashboard.traffic.loading}</p>
                        </div>
                      ) : subscription ? (
                        <div className="space-y-6">
                          <div className="flex items-center gap-3 mb-6">
                            <div className="flex-1 min-w-0">
                              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 leading-7 truncate">
                                {subscription.data?.plan?.name || t.dashboard.subscription.noActive}
                              </h2>
                              <div className="flex items-center gap-2 mt-1">
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                  {t.dashboard.subscription.expires}: {formatDate(subscription.data.expired_at)}
                                </p>
                                {subscription.data?.plan && (
                                  <div className="flex gap-2">
                                    <a 
                                      href={`/product/order?id=${subscription.data.plan_id}`}
                                      className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 transition-all duration-200"
                                    >
                                      {t.dashboard.subscription.renew}
                                    </a>
                                    {subscription.data.plan.reset_price !== null && subscription.data.plan.reset_price !== undefined && (
                                      <a 
                                        href={`/product/order?id=${subscription.data.plan_id}&reset=1`}
                                        className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 transition-all duration-200"
                                      >
                                        {t.dashboard.subscription.reset}
                                      </a>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {subscription.data?.plan ? (
                            <div className="space-y-6">
                              {/* Traffic Usage Card */}
                              <div className="rounded-xl bg-gradient-to-br from-indigo-50 dark:from-indigo-950 to-white dark:to-gray-800 p-4 shadow-sm ring-1 ring-gray-950/5 dark:ring-white/5">
                                <p className="text-base font-semibold text-gray-700 dark:text-gray-300">{t.dashboard.subscription.trafficUsage}</p>
                                <div className="mt-4">
                                  <div className="flex items-center justify-between mb-3">
                                    <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                                      {formatBytes(subscription.data.u + subscription.data.d)}
                                    </span>
                                    <span className="text-2xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                                      {formatBytes(subscription.data.transfer_enable)}
                                    </span>
                                  </div>
                                  <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                                    <div 
                                      className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-indigo-500 dark:from-indigo-500 dark:to-indigo-400 transition-all duration-300" 
                                      style={{ 
                                        width: `${Math.min(((subscription.data.u + subscription.data.d) / subscription.data.transfer_enable * 100), 100)}%` 
                                      }}
                                    />
                                  </div>
                                  <p className="mt-2 text-sm font-medium text-gray-600 dark:text-gray-400 text-right">
                                    {((subscription.data.u + subscription.data.d) / subscription.data.transfer_enable * 100).toFixed(1)}% {t.dashboard.subscription.used}
                                  </p>
                                </div>
                              </div>

                              {/* Node Selection Card */}
                              <div className="rounded-xl bg-gradient-to-br from-gray-50 dark:from-gray-900 to-white dark:to-gray-800 p-4 space-y-4 shadow-sm ring-1 ring-gray-950/5 dark:ring-white/5">
                                <div className="space-y-2">
                                  <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300">{t.dashboard.nodes.title}</h3>
                                  <Listbox value={selectedNode} onChange={setSelectedNode}>
                                    {({ open }) => (
                                      <div className="relative mt-1">
                                        <ListboxButton className="relative w-full cursor-default rounded-lg bg-white dark:bg-gray-800 py-2 pl-3 pr-10 text-left border dark:border-gray-700 focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-300 sm:text-sm">
                                          <span className="block truncate text-gray-900 dark:text-gray-100">
                                            {selectedNode
                                              ? selectedNode.name
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
                                          <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                            {nodeOptions.map((node) => (
                                              <ListboxOption
                                                key={node.id}
                                                value={node}
                                                className={({ active }) =>
                                                  `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                                    active ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-100' : 'text-gray-900 dark:text-gray-100'
                                                  }`
                                                }
                                              >
                                                {({ selected, active }) => (
                                                  <>
                                                    <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                                      {node.name}
                                                    </span>
                                                    {selected ? (
                                                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-600 dark:text-indigo-400">
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
                                  <p className="text-xs text-gray-500 dark:text-gray-400">{t.dashboard.nodes.selectHint}</p>
                                  
                                  {/* 协议筛选 */}
                                  <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300 mt-4">协议筛选</h3>
                                  <Listbox value={selectedProtocol} onChange={setSelectedProtocol}>
                                    {({ open }) => (
                                      <div className="relative mt-1">
                                        <ListboxButton className="relative w-full cursor-default rounded-lg bg-white dark:bg-gray-800 py-2 pl-3 pr-10 text-left border dark:border-gray-700 focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-300 sm:text-sm">
                                          <span className="block truncate text-gray-900 dark:text-gray-100">
                                            {selectedProtocol.name}
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
                                          <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                            {protocolOptions.map((protocol) => (
                                              <ListboxOption
                                                key={protocol.id}
                                                value={protocol}
                                                className={({ active }) =>
                                                  `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                                    active ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-100' : 'text-gray-900 dark:text-gray-100'
                                                  }`
                                                }
                                              >
                                                {({ selected, active }) => (
                                                  <>
                                                    <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                                      {protocol.name}
                                                    </span>
                                                    {selected ? (
                                                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-600 dark:text-indigo-400">
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
                                  <p className="text-xs text-gray-500 dark:text-gray-400">选择需要的协议进行筛选,默认为Shadowsocks</p>
                                </div>
                                
                                <div className="space-y-3 pt-2">
                                  <div className="grid grid-cols-1 gap-2">
                                    {[
                                      { id: 'copy', name: t.dashboard.traffic.copyUrl, onClick: () => handleCopyUrl(getFilteredUrl(subscription.data.token, selectedNode, [selectedProtocol])) },
                                      ...(['clash', 'surge', 'shadowrocket', 'surfboard', 'quantumult-x', 'loon'] as const).map(client => ({
                                        id: client,
                                        name: client === 'quantumult-x' ? 'Quantumult X' : client.charAt(0).toUpperCase() + client.slice(1),
                                        href: (() => {
                                          const url = getFilteredUrl(subscription.data.token, selectedNode, [selectedProtocol]);
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
                                          className="flex items-center justify-center gap-1.5 px-2.5 py-2 text-sm font-medium bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-lg hover:from-indigo-500 hover:to-indigo-400 transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                        >
                                          {item.name}
                                        </button>
                                      ) : (
                                        <a
                                          key={item.id}
                                          href={item.href}
                                          className={`flex items-center justify-center gap-1.5 px-2.5 py-2 text-sm font-medium ${
                                            ['clash', 'surge', 'shadowrocket', 'surfboard', 'quantumult-x'].includes(item.id)
                                              ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                          } rounded-lg transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                            ['clash', 'surge', 'shadowrocket', 'surfboard', 'quantumult-x'].includes(item.id)
                                              ? 'focus:ring-gray-500 dark:focus:ring-gray-400'
                                              : 'focus:ring-gray-500 dark:focus:ring-gray-400'
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
                            <div className="rounded-xl bg-gradient-to-br from-gray-50 dark:from-gray-900 to-white dark:to-gray-800 p-6 text-center shadow-sm ring-1 ring-gray-950/5 dark:ring-white/5">
                              <p className="text-sm text-gray-500 dark:text-gray-400">{t.dashboard.purchase.needSubscription}</p>
                              <a href="/product" className="mt-4 inline-block px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-lg hover:from-indigo-500 hover:to-indigo-400 transition-colors">
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
                </div>

                {/* User Info Card */}
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative flex h-full flex-col overflow-hidden rounded-2xl bg-white dark:bg-gray-800">
                    <div className="px-8 pt-8 pb-3 sm:px-10">
                      <div className="mb-8">
                          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 leading-7">
                            {t.dashboard.userInfo}
                          </h2>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            {userInfo?.data.email}
                          </p>
                        </div>

                      <div className="mt-6">
                        {loadingUserInfo ? (
                          <div className="flex justify-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                          </div>
                        ) : userInfo ? (
                          <div className="space-y-6">
                            {/* UUID Card */}
                            <div className="rounded-xl bg-gradient-to-br from-indigo-50 dark:from-indigo-950 to-white dark:to-gray-800 p-4 shadow-sm ring-1 ring-gray-950/5 dark:ring-white/5">
                              <div className="flex items-center justify-between mb-4">
                                <p className="text-base font-semibold text-gray-700 dark:text-gray-300">UUID</p>
                                <button
                                  onClick={() => setShowUUID(!showUUID)}
                                  className="inline-flex items-center gap-x-1.5 rounded-md bg-gradient-to-br from-indigo-50 dark:from-indigo-950 to-white dark:to-gray-800 px-2.5 py-1.5 text-xs font-medium text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                >
                                  {showUUID ? t.dashboard.uuid.hide : t.dashboard.uuid.show}
                                </button>
                              </div>
                              <p className="text-base font-medium text-gray-900 dark:text-gray-100 tracking-wide break-all font-mono">
                                {showUUID ? userInfo.data.uuid : '••••••••-••••-••••-••••-••••••••••••'}
                              </p>
                            </div>

                            {/* Balance Cards */}
                            <div className="grid grid-cols-2 gap-4">
                              <div className="rounded-xl bg-gradient-to-br from-indigo-50 dark:from-indigo-950 to-white dark:to-gray-800 p-4 shadow-sm ring-1 ring-gray-950/5 dark:ring-white/5">
                                <p className="text-base font-semibold text-gray-700 dark:text-gray-300">{t.dashboard.balance}</p>
                                <p className="mt-2 text-2xl font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                                  ¥{(userInfo.data.balance / 100).toFixed(2)}
                                </p>
                              </div>
                              <div className="rounded-xl bg-gradient-to-br from-indigo-50 dark:from-indigo-950 to-white dark:to-gray-800 p-4 shadow-sm ring-1 ring-gray-950/5 dark:ring-white/5">
                                <p className="text-base font-semibold text-gray-700 dark:text-gray-300">{t.dashboard.commission}</p>
                                <p className="mt-2 text-2xl font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                                  ¥{(userInfo.data.commission_balance / 100).toFixed(2)}
                                </p>
                              </div>
                            </div>
                            
                            {/* User Details Card */}
                            <div className="rounded-xl bg-gradient-to-br from-gray-50 dark:from-gray-900 to-white dark:to-gray-800 p-4 space-y-3 shadow-sm ring-1 ring-gray-950/5 dark:ring-white/5">
                              <div className="flex justify-between text-sm">
                                <span className="font-medium text-gray-600 dark:text-gray-400">{t.dashboard.memberSince}</span>
                                <span className="font-semibold text-gray-900 dark:text-gray-100">
                                  {new Date(userInfo.data.created_at * 1000).toLocaleDateString()}
                                </span>
                              </div>
                              {userInfo.data.telegram_id && (
                                <div className="flex justify-between text-sm">
                                  <span className="font-medium text-gray-600 dark:text-gray-400">{t.common.telegram}</span>
                                  <span className="font-semibold text-gray-900 dark:text-gray-100">{t.common.connected}</span>
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
                </div>

                {/* Traffic Stats Card */}
                <div className="lg:col-span-2 relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative flex h-full flex-col overflow-hidden rounded-2xl bg-white dark:bg-gray-800">
                    <div className="px-8 pt-6 pb-3 sm:px-10 sm:pt-8">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 leading-7 mb-6">{t.dashboard.trafficStats}</h3>
                      {loadingTraffic ? (
                        <div className="flex justify-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
                        </div>
                      ) : trafficLog.length > 0 ? (
                        <div className="rounded-xl bg-gradient-to-br from-gray-50 dark:from-gray-900 to-white dark:to-gray-800 p-2 shadow-sm ring-1 ring-gray-950/5 dark:ring-white/5">
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
                                  tick={{ transform: 'translate(0, 6)', fill: '#6B7280' }}
                                />
                                <YAxis 
                                  stroke="#6B7280"
                                  fontSize={isMobile ? 10 : 12}
                                  tickLine={false}
                                  axisLine={{ stroke: '#E5E7EB' }}
                                  tickFormatter={formatTraffic}
                                  width={isMobile ? 50 : 60}
                                  dx={-4}
                                  allowDecimals={false}
                                  tick={{ transform: 'translate(-3, 0)', fill: '#6B7280' }}
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
                                    color: '#111827'
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
                        <div className="rounded-xl bg-gradient-to-br from-gray-50 dark:from-gray-900 to-white dark:to-gray-800 p-6 text-center shadow-sm ring-1 ring-gray-950/5 dark:ring-white/5">
                          <p className="text-sm text-gray-500 dark:text-gray-400">No traffic data available</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Reset UUID Dialog */}
      <Dialog 
        open={isResetDialogOpen} 
        onClose={() => setIsResetDialogOpen(false)}
        className="relative z-10"
      >
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-gray-500/75 dark:bg-gray-950/75 backdrop-blur-sm transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
        />

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <DialogPanel
              transition
              className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 text-left shadow-xl transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-8 sm:w-full sm:max-w-lg data-closed:sm:translate-y-0 data-closed:sm:scale-95"
            >
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full bg-yellow-100 sm:mx-0 sm:size-10">
                    <ExclamationTriangleIcon aria-hidden="true" className="size-6 text-yellow-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <DialogTitle as="h3" className="text-base font-semibold text-gray-900 dark:text-gray-100">
                      {t.dashboard.uuid.reset}
                    </DialogTitle>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t.dashboard.uuid.confirmReset}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                  type="button"
                  onClick={handleResetUUID}
                  className="inline-flex w-full justify-center rounded-md bg-gradient-to-r from-indigo-600 to-indigo-500 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:from-indigo-500 hover:to-indigo-400 sm:ml-3 sm:w-auto transition-all duration-200"
                >
                  {t.dashboard.uuid.reset}
                </button>
                <button
                  type="button"
                  data-autofocus
                  onClick={() => setIsResetDialogOpen(false)}
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white dark:bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100 ring-1 shadow-xs ring-gray-300 dark:ring-gray-700 ring-inset hover:bg-gray-50 dark:hover:bg-gray-700 sm:mt-0 sm:w-auto transition-all duration-200"
                >
                  {t.dashboard.uuid.cancel}
                </button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>

      {/* Copy Notification */}
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

      {/* 通知弹窗 */}
      <HeadlessTransition appear show={showNotices} as={Fragment}>
        <HeadlessDialog as="div" className="relative z-50" onClose={() => setShowNotices(false)}>
          <HeadlessTransition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/30" />
          </HeadlessTransition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <HeadlessTransition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <HeadlessDialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                  <HeadlessDialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100 mb-4">
                    通知
                  </HeadlessDialog.Title>
                  {notices.length === 0 ? (
                    <div className="text-gray-500 dark:text-gray-400 text-center py-8">暂无通知</div>
                  ) : (
                    <ul className="space-y-3 max-h-80 overflow-y-auto pr-2">
                      {notices.map((notice: any) => (
                        <li key={notice.id} className="bg-yellow-50 dark:bg-yellow-900/60 border border-yellow-200 dark:border-yellow-700 rounded px-4 py-2 text-sm text-yellow-800 dark:text-yellow-100 font-medium">
                          {notice.content}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-6 flex justify-end">
                    <button
                      className="inline-flex justify-center rounded-md border border-transparent bg-indigo-100 dark:bg-indigo-900 px-4 py-2 text-sm font-medium text-indigo-900 dark:text-indigo-100 hover:bg-indigo-200 dark:hover:bg-indigo-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                      onClick={() => setShowNotices(false)}
                    >
                      关闭
                    </button>
                  </div>
                </HeadlessDialog.Panel>
              </HeadlessTransition.Child>
            </div>
          </div>
        </HeadlessDialog>
      </HeadlessTransition>

      {/* 通知弹窗（自动弹窗，仅显示 tags 含"弹窗"的一条） */}
      <HeadlessTransition appear show={showPopupNotice} as={Fragment}>
        <HeadlessDialog as="div" className="relative z-50" onClose={() => setShowPopupNotice(false)}>
          <HeadlessTransition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/30" />
          </HeadlessTransition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <HeadlessTransition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <HeadlessDialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-0 text-left align-middle shadow-xl transition-all">
                  <div className="flex items-start gap-4 p-4 sm:p-6">
                    <span className="flex-shrink-0 inline-flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900">
                      <ExclamationCircleIcon className="h-7 w-7 text-yellow-600 dark:text-yellow-300" aria-hidden="true" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <HeadlessDialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900 dark:text-gray-100">
                        {popupNotice?.title || '通知'}
                      </HeadlessDialog.Title>
                      <div className="mt-2 text-sm text-gray-700 dark:text-gray-200 whitespace-pre-line">
                        {popupNotice?.content}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end px-4 pb-4">
                    <button
                      className="inline-flex justify-center rounded-md border border-transparent bg-indigo-100 dark:bg-indigo-900 px-4 py-2 text-sm font-medium text-indigo-900 dark:text-indigo-100 hover:bg-indigo-200 dark:hover:bg-indigo-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                      onClick={() => setShowPopupNotice(false)}
                    >
                      关闭
                    </button>
                  </div>
                </HeadlessDialog.Panel>
              </HeadlessTransition.Child>
            </div>
          </div>
        </HeadlessDialog>
      </HeadlessTransition>
    </>
  )
}
