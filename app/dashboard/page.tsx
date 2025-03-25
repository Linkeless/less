'use client';
import { Disclosure, DisclosureButton, DisclosurePanel, Menu, MenuButton, MenuItem, MenuItems, Listbox, ListboxButton, ListboxOptions, ListboxOption, Dialog, DialogPanel, DialogTitle, DialogBackdrop, Transition } from '@headlessui/react'
import { Bars3Icon, BellIcon, XMarkIcon, ChevronDownIcon, CheckIcon, ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { getSubscription, fetchKnowledge, fetchTickets, fetchUserInfo, resetUUID, getTrafficLog } from '@/lib/api'
import { useEffect, useState } from 'react'
import md5 from 'md5'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

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

const navigation = [
  { name: 'Dashboard', href: '#', current: true },
  { name: 'Product', href: '/product', current: false },
  { name: 'Orders', href: '/orders', current: false },
  // { name: 'Calendar', href: '#', current: false },
  // { name: 'Reports', href: '#', current: false },
]

const userNavigation = [
  { 
    name: 'Sign out', 
    onClick: () => {
      localStorage.clear();
      window.location.href = '/login';
    }
  },
]

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

interface Subscription {
  data: {
    plan: { 
      name: string;
      id: number;
    };
    plan_id: number;
    email: string;
    u: number;
    d: number;
    transfer_enable: number;
    expired_at: string | null;
    subscribe_url: string;
    token: string;
  };
  status: string;
}

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

interface TrafficLog {
  created_at: number;
  u: number;
  d: number;
}

interface ProcessedTrafficData {
  date: string;
  download: number;
  upload: number;
}

const processTrafficData = (data: any[]): ProcessedTrafficData[] => {
  const dailyData = new Map<number, { download: number; upload: number }>();
  
  data.forEach(item => {
    const day = item.record_at;
    const current = dailyData.get(day) || { download: 0, upload: 0 };
    
    // Convert to GB and consider server_rate
    const rate = parseFloat(item.server_rate);
    dailyData.set(day, {
      download: current.download + (item.d * rate) / (1024 * 1024 * 1024),
      upload: current.upload + (item.u * rate) / (1024 * 1024 * 1024)
    });
  });

  return Array.from(dailyData.entries())
    .map(([timestamp, traffic]) => ({
      date: new Date(timestamp * 1000).toLocaleDateString(),
      download: Number(traffic.download.toFixed(2)),
      upload: Number(traffic.upload.toFixed(2))
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

const formatTraffic = (value: number) => {
  if (value < 1) {
    return `${(value * 1024).toFixed(0)}MB`;  // Removed space before MB
  }
  return `${value.toFixed(1)}GB`;  // Removed space before GB
};

export default function Example() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedNodes, setSelectedNodes] = useState<typeof nodeOptions>([])
  const [knowledgeArticles, setKnowledgeArticles] = useState<{[category: string]: Array<{id: number, title: string}>}>({})
  const [loadingKnowledge, setLoadingKnowledge] = useState(true)
  const [tickets, setTickets] = useState<Array<{id: number; subject: string; status: string; created_at: number}>>([])
  const [loadingTickets, setLoadingTickets] = useState(true)
  const [userInfo, setUserInfo] = useState<any>(null)
  const [loadingUserInfo, setLoadingUserInfo] = useState(true)
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)
  const [showCopyNotification, setShowCopyNotification] = useState(false)
  const [showUUID, setShowUUID] = useState(false);
  const [trafficLog, setTrafficLog] = useState<TrafficLog[]>([])
  const [loadingTraffic, setLoadingTraffic] = useState(true)

  // Move user object inside component
  const user = {
    name: userInfo ? userInfo.email.split('@')[0] : 'User',
    email: userInfo ? userInfo.email : '',
    imageUrl: userInfo ? getGravatarUrl(userInfo.email) : getGravatarUrl(''),
  }

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const data = await getSubscription()
        setSubscription(data)
      } catch (error) {
        console.error('Failed to fetch subscription:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSubscription()

    const fetchKnowledgeData = async () => {
      try {
        const response = await fetchKnowledge()
        setKnowledgeArticles(response.data)
      } catch (error) {
        console.error('Failed to fetch knowledge base:', error)
      } finally {
        setLoadingKnowledge(false)
      }
    }

    fetchKnowledgeData()

    const fetchTicketData = async () => {
      try {
        const response = await fetchTickets()
        setTickets(response.data)
      } catch (error) {
        console.error('Failed to fetch tickets:', error)
      } finally {
        setLoadingTickets(false)
      }
    }

    fetchTicketData()

    const fetchUserData = async () => {
      try {
        const response = await fetchUserInfo()
        setUserInfo(response.data)
      } catch (error) {
        console.error('Failed to fetch user info:', error)
      } finally {
        setLoadingUserInfo(false)
      }
    }

    fetchUserData()

    const fetchTrafficLog = async () => {
      try {
        const response = await getTrafficLog()
        setTrafficLog(response.data || [])
      } catch (error) {
        console.error('Failed to fetch traffic log:', error)
      } finally {
        setLoadingTraffic(false)
      }
    }

    fetchTrafficLog()
  }, [])

  const handleResetUUID = async () => {
    try {
      const response = await resetUUID();
      setUserInfo((prev: any) => ({
        ...prev,
        uuid: response.data.uuid
      }));
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

  return (
    <>
      <style jsx global>{globalStyles}</style>
      <div className="min-h-[100dvh] flex flex-col">
        <Disclosure as="nav" className="bg-white border-b border-gray-200 flex-none">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center">
                <div className="shrink-0">
                  <a href="/">
                    <img
                      alt="Linkeless"
                      src="/Linkeless.png"
                      className="size-8"
                    />
                  </a>
                </div>
                <div className="hidden md:block">
                  <div className="ml-10 flex items-baseline space-x-4">
                    {navigation.map((item) => (
                      <a
                        key={item.name}
                        href={item.href}
                        aria-current={item.current ? 'page' : undefined}
                        className={classNames(
                          item.current ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900',
                          'rounded-md px-3 py-2 text-sm font-medium',
                        )}
                      >
                        {item.name}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="ml-4 flex items-center md:ml-6">
                  <button
                    type="button"
                    className="relative rounded-full bg-white p-1 text-gray-400 hover:text-gray-500 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-hidden"
                  >
                    <span className="absolute -inset-1.5" />
                    <span className="sr-only">View notifications</span>
                    <BellIcon aria-hidden="true" className="size-6" />
                  </button>

                  {/* Profile dropdown */}
                  <Menu as="div" className="relative ml-3">
                    <div>
                      <MenuButton className="relative flex max-w-xs items-center rounded-full bg-white text-sm focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-hidden">
                        <span className="absolute -inset-1.5" />
                        <span className="sr-only">Open user menu</span>
                        <img 
                          alt="" 
                          src={userInfo ? getGravatarUrl(userInfo.email) : user.imageUrl} 
                          className="size-8 rounded-full" 
                        />
                      </MenuButton>
                    </div>
                    <MenuItems
                      transition
                      className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 ring-1 shadow-lg ring-black/5 transition focus:outline-hidden data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
                    >
                      {userNavigation.map((item) => (
                        <MenuItem key={item.name}>
                          <button
                            onClick={item.onClick}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 data-focus:bg-gray-100 data-focus:outline-hidden"
                          >
                            {item.name}
                          </button>
                        </MenuItem>
                      ))}
                    </MenuItems>
                  </Menu>
                </div>
              </div>
              <div className="-mr-2 flex md:hidden">
                {/* Mobile menu button */}
                <DisclosureButton className="group relative inline-flex items-center justify-center rounded-md bg-white p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-hidden">
                  <span className="absolute -inset-0.5" />
                  <span className="sr-only">Open main menu</span>
                  <Bars3Icon aria-hidden="true" className="block size-6 group-data-open:hidden" />
                  <XMarkIcon aria-hidden="true" className="hidden size-6 group-data-open:block" />
                </DisclosureButton>
              </div>
            </div>
          </div>

          <DisclosurePanel className="md:hidden">
            <div className="space-y-1 px-2 pt-2 pb-3 sm:px-3">
              {navigation.map((item) => (
                <DisclosureButton
                  key={item.name}
                  as="a"
                  href={item.href}
                  aria-current={item.current ? 'page' : undefined}
                  className={classNames(
                    item.current ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900',
                    'block rounded-md px-3 py-2 text-base font-medium',
                  )}
                >
                  {item.name}
                </DisclosureButton>
              ))}
            </div>
            <div className="border-t border-gray-200 pt-4 pb-3">
              <div className="flex items-center px-5">
                <div className="shrink-0">
                  <img 
                    alt="" 
                    src={userInfo ? getGravatarUrl(userInfo.email) : user.imageUrl} 
                    className="size-10 rounded-full" 
                  />
                </div>
                <div className="ml-3">
                  <div className="text-base/5 font-medium text-gray-900">{user.name}</div>
                  <div className="text-sm font-medium text-gray-500">{user.email}</div>
                </div>
                <button
                  type="button"
                  className="relative ml-auto shrink-0 rounded-full bg-white p-1 text-gray-400 hover:text-gray-500 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-hidden"
                >
                  <span className="absolute -inset-1.5" />
                  <span className="sr-only">View notifications</span>
                  <BellIcon aria-hidden="true" className="size-6" />
                </button>
              </div>
              <div className="mt-3 space-y-1 px-2">
                {userNavigation.map((item) => (
                  <DisclosureButton
                    key={item.name}
                    as="button"
                    onClick={item.onClick}
                    className="block w-full rounded-md px-3 py-2 text-base font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                  >
                    {item.name}
                  </DisclosureButton>
                ))}
              </div>
            </div>
          </DisclosurePanel>
        </Disclosure>

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
                          <p className="mt-4 text-sm text-gray-500">Loading subscription info...</p>
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
                                <h2 className="text-lg font-semibold text-gray-900 truncate">
                                  {subscription.data?.plan?.name || 'No active subscription'}
                                </h2>
                                <div className="flex items-center gap-2">
                                  <p className="text-sm text-gray-500">
                                    Expires: {formatDate(subscription.data.expired_at)}
                                  </p>
                                  <a 
                                    href={`/product/order?id=${subscription.data.plan_id}`}
                                    className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                                  >
                                    Renew
                                  </a>
                                </div>
                              </div>
                          </div>

                          {subscription.data?.plan ? (
                            <div className="space-y-6">
                              <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-white p-4 shadow-sm ring-1 ring-gray-950/5">
                                <p className="text-sm font-medium text-gray-500">Traffic Usage</p>
                                <div className="mt-3">
                                  <div className="flex items-center justify-between text-sm mb-2">
                                    <span className="text-gray-700 font-medium">{((subscription.data.u + subscription.data.d) / 1024 / 1024 / 1024).toFixed(2)} GB</span>
                                    <span className="text-gray-700 font-medium">{(subscription.data.transfer_enable / 1024 / 1024 / 1024).toFixed(2)} GB</span>
                                  </div>
                                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                                    <div 
                                      className="h-full rounded-full bg-indigo-600 transition-all duration-300" 
                                      style={{ 
                                        width: `${Math.min(((subscription.data.u + subscription.data.d) / subscription.data.transfer_enable * 100), 100)}%` 
                                      }}
                                    />
                                  </div>
                                  <p className="mt-1 text-xs text-gray-500 text-right">
                                    {((subscription.data.u + subscription.data.d) / subscription.data.transfer_enable * 100).toFixed(1)}% Used
                                  </p>
                                </div>
                              </div>

                              <div className="rounded-xl bg-gradient-to-br from-gray-50 to-white p-4 space-y-4 shadow-sm ring-1 ring-gray-950/5">
                                <div className="space-y-2">
                                  <h3 className="text-sm font-medium text-gray-900">Subscribe Methods</h3>
                                  <Listbox value={selectedNodes} onChange={setSelectedNodes} multiple>
                                    <div className="relative">
                                      <ListboxButton className="relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left border focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-300 sm:text-sm">
                                        <span className="block truncate">
                                          {selectedNodes.length ? `${selectedNodes.length} Regional Entrance Selected` : 'Select Regional Entrance'}
                                        </span>
                                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                          <ChevronDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                        </span>
                                      </ListboxButton>
                                      <ListboxOptions className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-10">
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
                                            {({ selected }) => (
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
                                    </div>
                                  </Listbox>
                                  <p className="text-xs text-gray-500">
                                    Select Entry Region, default to all.
                                  </p>
                                </div>
                                
                                <div className="space-y-3 pt-2">
                                  <div className="grid grid-cols-1 gap-2">
                                    {[
                                      { id: 'copy', name: 'Copy URL', onClick: () => handleCopyUrl(getFilteredUrl(subscription.data.token, selectedNodes)) },
                                      ...(['clash', 'surge', 'shadowrocket', 'surfboard', 'quantumult-x'] as const).map(client => ({
                                        id: client,
                                        name: client === 'quantumult-x' ? 'Quantumult X' : client.charAt(0).toUpperCase() + client.slice(1),
                                        href: (() => {
                                          const url = getFilteredUrl(subscription.data.token, selectedNodes);
                                          const clientUrls = {
                                            'clash': `clash://install-config?url=${encodeURIComponent(url)}`,
                                            'surge': `surge:///install-config?url=${encodeURIComponent(url)}`,
                                            'shadowrocket': `shadowrocket://add/sub://${btoa(url)}`,
                                            'surfboard': `surfboard:///install-config?url=${encodeURIComponent(url)}`,
                                            'quantumult-x': `quantumult-x:///update-configuration?remote-resource=${encodeURIComponent(url)}`
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
                              <p className="text-sm text-gray-500">Please purchase a subscription to access the service.</p>
                              <a href="/product" className="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                                Purchase Now
                              </a>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <p className="text-sm text-gray-500">Failed to load subscription data</p>
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
                          src={userInfo ? getGravatarUrl(userInfo.email) : user.imageUrl} 
                          alt="" 
                          className="h-16 w-16 rounded-full ring-4 ring-gray-50" 
                        />
                        <div className="flex-1 min-w-0">
                          <h2 className="text-lg font-semibold text-gray-900 truncate">
                            User Information
                          </h2>
                          <p className="text-sm text-gray-500 truncate">
                            {userInfo?.email}
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
                                <p className="text-base font-medium text-gray-500">UUID</p>
                                <button
                                  onClick={() => setShowUUID(!showUUID)}
                                  className="inline-flex items-center gap-x-1.5 rounded-md bg-gradient-to-br from-indigo-50 to-white px-2.5 py-1.5 text-xs font-medium text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                >
                                  {showUUID ? 'Hide' : 'Show'}
                                </button>
                              </div>
                              <p className="text-base text-gray-900 font-medium break-all">
                                {showUUID ? userInfo.uuid : '••••••••-••••-••••-••••-••••••••••••'}
                              </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-white p-4 shadow-sm ring-1 ring-gray-950/5">
                                <p className="text-sm font-medium text-gray-500">Balance</p>
                                <p className="mt-2 text-2xl font-semibold text-indigo-600">¥{(userInfo.balance / 100).toFixed(2)}</p>
                              </div>
                              <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-white p-4 shadow-sm ring-1 ring-gray-950/5">
                                <p className="text-sm font-medium text-gray-500">Commission</p>
                                <p className="mt-2 text-2xl font-semibold text-indigo-600">¥{(userInfo.commission_balance / 100).toFixed(2)}</p>
                              </div>
                            </div>
                            
                            <div className="rounded-xl bg-gradient-to-br from-gray-50 to-white p-4 space-y-3 shadow-sm ring-1 ring-gray-950/5">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Member Since</span>
                                <span className="text-gray-900 font-medium">{new Date(userInfo.created_at * 1000).toLocaleDateString()}</span>
                              </div>
                              {userInfo.telegram_id && (
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-500">Telegram</span>
                                  <span className="text-gray-900 font-medium">Connected</span>
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
                      <h3 className="text-lg font-semibold text-gray-900 mb-6">Traffic Statistics</h3>
                      {loadingTraffic ? (
                        <div className="flex justify-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                        </div>
                      ) : trafficLog.length > 0 ? (
                        <div className="rounded-xl bg-gradient-to-br from-gray-50 to-white p-6 shadow-sm ring-1 ring-gray-950/5">
                          <div className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart 
                                data={processTrafficData(trafficLog)}
                                margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                              >
                                <CartesianGrid 
                                  strokeDasharray="3 3" 
                                  stroke="#E5E7EB" 
                                  vertical={false}
                                />
                                <XAxis 
                                  dataKey="date" 
                                  stroke="#6B7280"
                                  fontSize={12}
                                  tickLine={false}
                                  axisLine={{ stroke: '#E5E7EB' }}
                                  dy={10}
                                />
                                <YAxis 
                                  stroke="#6B7280"
                                  fontSize={12}
                                  tickLine={false}
                                  axisLine={{ stroke: '#E5E7EB' }}
                                  tickFormatter={formatTraffic}
                                  width={65}  // Fixed width for Y-axis
                                  dx={-10}
                                  allowDecimals={false}  // Avoid decimal points in axis
                                />
                                <Tooltip
                                  cursor={{ stroke: '#E5E7EB', strokeWidth: 1 }}
                                  contentStyle={{
                                    backgroundColor: '#ffffff',
                                    border: 'none',
                                    borderRadius: '0.75rem',
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                    padding: '0.75rem 1rem',
                                  }}
                                  labelStyle={{
                                    color: '#111827',
                                    fontWeight: 600,
                                    marginBottom: '0.5rem',
                                  }}
                                  itemStyle={{
                                    color: '#4B5563',
                                    fontSize: '0.875rem',
                                    padding: '0.25rem 0',
                                  }}
                                  formatter={(value: number, name: string) => [
                                    formatTraffic(value),
                                    name === 'download' ? 'Download' : 'Upload'
                                  ]}
                                  labelFormatter={(label) => `Date: ${label}`}  // Add "Date:" prefix
                                />
                                <Line 
                                  type="monotone" 
                                  dataKey="download" 
                                  stroke="#6366F1"
                                  strokeWidth={2.5}
                                  dot={false}
                                  activeDot={{ 
                                    r: 6, 
                                    strokeWidth: 2,
                                    stroke: '#ffffff',
                                    fill: '#6366F1'
                                  }}
                                />
                                <Line 
                                  type="monotone" 
                                  dataKey="upload" 
                                  stroke="#34D399"
                                  strokeWidth={2.5}
                                  dot={false}
                                  activeDot={{ 
                                    r: 6,
                                    strokeWidth: 2,
                                    stroke: '#ffffff',
                                    fill: '#34D399'
                                  }}
                                />
                              </LineChart>
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
                      Reset UUID
                    </DialogTitle>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to reset your UUID? This action cannot be undone.
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
                  Reset
                </button>
                <button
                  type="button"
                  data-autofocus
                  onClick={() => setIsResetDialogOpen(false)}
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 shadow-xs ring-gray-300 ring-inset hover:bg-gray-50 sm:mt-0 sm:w-auto"
                >
                  Cancel
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
                Copied to clipboard
              </p>
            </div>
          </div>
        </Transition>
      </div>
    </>
  )
}
