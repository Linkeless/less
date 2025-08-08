'use client';
import { Listbox, ListboxButton, ListboxOptions, ListboxOption, Transition } from '@headlessui/react';
import { ChevronDownIcon, CheckIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import type { Subscription, UserInfoResponse } from '@/lib/types';
import { formatBytes } from '@/lib/api';
import type { TranslationValues } from '@/lib/i18n/context';
// Import utils
import { getFilteredUrl, formatExpireDate } from '@/lib/utils';

interface NodeOption {
  id: number;
  name: string;
}

interface ProtocolOption {
  id: string;
  name: string;
}

const nodeOptions: NodeOption[] = [
  { id: 1, name: '广州' },
  { id: 2, name: '上海' },
  { id: 3, name: '北京' },
  { id: 4, name: '成都' },
];

const protocolOptions: ProtocolOption[] = [
  { id: 'ss', name: 'Shadowsocks' },
  { id: 'ss2022', name: 'SS-2022' }
];

interface SubscriptionCardProps {
  subscription: Subscription | null;
  loading: boolean;
  userInfo: UserInfoResponse | null;
  t: TranslationValues;
  handleCopyUrl: (url: string) => Promise<void>;
}

export default function SubscriptionCard({
  subscription,
  loading,
  userInfo,
  t,
  handleCopyUrl,
}: SubscriptionCardProps) {
  const [selectedNode, setSelectedNode] = useState<NodeOption | null>(null);
  const [selectedProtocol, setSelectedProtocol] = useState<ProtocolOption>(protocolOptions[0]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 leading-7">订阅信息</h2>
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">{t.dashboard.traffic.loading}</p>
        </div>
      </div>
    );
  }

  if (!subscription || !userInfo) {
    return (
      <div className="space-y-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 leading-7">订阅信息</h2>
        <div className="text-center py-12">
          <p className="text-sm text-gray-500">{t.dashboard.traffic.loadFailed}</p>
        </div>
        {!subscription?.data?.length && (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500 dark:text-gray-400">{t.dashboard.purchase.needSubscription}</p>
            <a href="/product" className="mt-4 inline-block px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-lg hover:from-indigo-500 hover:to-indigo-400 transition-colors">
              {t.dashboard.purchase.purchaseNow}
            </a>
          </div>
        )}
      </div>
    );
  }
  
  const firstSubscription = subscription?.data?.[0];
  const currentPlan = null; // 新格式中不再有plan对象
  const token = userInfo?.data?.uuid || ''; 
  const generatedUrlForCopy = getFilteredUrl(token, selectedNode, [selectedProtocol]);

  return (
    <div className="space-y-6">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 leading-7">订阅信息</h2>
      
      <div className="space-y-8">
        <div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
              {firstSubscription ? `订阅 #${firstSubscription.id}` : t.dashboard.subscription.noActive}
            </h3>
            <div className="flex flex-row items-center justify-between gap-2 mt-1">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {t.dashboard.subscription.expires}：{formatExpireDate(userInfo?.data?.expired_at)}
              </div>
              {firstSubscription && (
                <div className="flex gap-2">
                  <a
                    href={`/product/order?id=${firstSubscription.subscription_plan_id}`}
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 transition"
                    aria-label={t.dashboard.subscription.renew}
                  >
                    <ArrowPathIcon className="w-5 h-5" aria-hidden="true" />
                    {t.dashboard.subscription.renew}
                  </a>
                  {firstSubscription && (
                    <a
                      href={`/product/order?id=${firstSubscription.subscription_plan_id}&reset=1`}
                      className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 transition-all duration-200"
                    >
                      {t.dashboard.subscription.reset}
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
          {currentPlan && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t.dashboard.subscription.trafficUsage}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatBytes(0)} / {formatBytes(userInfo?.data?.transfer_enable || 0)}
                </span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden mb-1">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-indigo-500 dark:from-indigo-500 dark:to-indigo-400 transition-all duration-300"
                  style={{
                    width: `0%`
                  }}
                />
              </div>
              <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                {(((userInfo?.data?.u || 0) + (userInfo?.data?.d || 0)) / (userInfo?.data?.transfer_enable || 1) * 100).toFixed(1)}% 已用
              </div>
            </div>
          )}
        </div>

        {currentPlan ? (
          <div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-4">
              <div className="flex flex-col">
                <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300 leading-relaxed">{t.dashboard.nodes.title}</h3>
                <Listbox
                  value={selectedNode}
                  onChange={node => {
                    if (!node) {
                      setSelectedNode(null);
                    } else if (selectedNode?.id === node.id) {
                      setSelectedNode(null);
                    } else {
                      setSelectedNode(node);
                    }
                  }}
                >
                  {({ open }) => (
                    <div className="relative mt-1">
                      <ListboxButton className="relative w-full cursor-default rounded-lg bg-white dark:bg-gray-800 py-2 pl-3 pr-10 text-left border dark:border-gray-700 focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-300 sm:text-sm">
                        <span className="block truncate text-gray-900 dark:text-gray-100">
                          {selectedNode ? selectedNode.name : t.dashboard.nodes.selectRegion}
                        </span>
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                          <ChevronDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </span>
                      </ListboxButton>
                      <Transition show={open} as="div" leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                          {nodeOptions.map((node) => (
                            <ListboxOption key={node.id} value={node} className={({ active }) => `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-100' : 'text-gray-900 dark:text-gray-100'}`}>
                              {({ selected }) => (
                                <>
                                  <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>{node.name}</span>
                                  {selected ? <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-600 dark:text-indigo-400"><CheckIcon className="h-5 w-5" aria-hidden="true" /></span> : null}
                                </>
                              )}
                            </ListboxOption>
                          ))}
                        </ListboxOptions>
                      </Transition>
                    </div>
                  )}
                </Listbox>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">{t.dashboard.nodes.selectHint}</p>
              </div>
              <div className="flex flex-col">
                <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300 leading-relaxed">协议筛选</h3>
                <Listbox value={selectedProtocol} onChange={setSelectedProtocol}>
                  {({ open }) => (
                    <div className="relative mt-1">
                      <ListboxButton className="relative w-full cursor-default rounded-lg bg-white dark:bg-gray-800 py-2 pl-3 pr-10 text-left border dark:border-gray-700 focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-300 sm:text-sm">
                        <span className="block truncate text-gray-900 dark:text-gray-100">{selectedProtocol.name}</span>
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                          <ChevronDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </span>
                      </ListboxButton>
                      <Transition show={open} as="div" leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                          {protocolOptions.map((protocol) => (
                            <ListboxOption key={protocol.id} value={protocol} className={({ active }) => `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-100' : 'text-gray-900 dark:text-gray-100'}`}>
                              {({ selected }) => (
                                <>
                                  <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>{protocol.name}</span>
                                  {selected ? <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-600 dark:text-indigo-400"><CheckIcon className="h-5 w-5" aria-hidden="true" /></span> : null}
                                </>
                              )}
                            </ListboxOption>
                          ))}
                        </ListboxOptions>
                      </Transition>
                    </div>
                  )}
                </Listbox>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">选择需要的协议进行筛选，默认为Shadowsocks</p>
              </div>
            </div>
            <div className="mt-6">
              <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-4">客户端下载</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-2">
                {[
                  { id: 'copy', name: t.dashboard.traffic.copyUrl, onClick: () => handleCopyUrl(generatedUrlForCopy) },
                  ...(['clash', 'surge', 'shadowrocket', 'surfboard', 'quantumult-x', 'loon'] as const).map(client => ({
                    id: client,
                    name: client === 'quantumult-x' ? 'Quantumult X' : client.charAt(0).toUpperCase() + client.slice(1),
                    href: (() => {
                      const url = getFilteredUrl(token, selectedNode, [selectedProtocol]);
                      const clientUrls = {
                        'clash': `clash://install-config?url=${encodeURIComponent(url + '&flag=clash')}`,
                        'surge': `surge:///install-config?url=${encodeURIComponent(url + '&flag=surge')}`,
                        'shadowrocket': `shadowrocket://add/sub://${btoa(url + '&flag=shadowrocket')}`,
                        'surfboard': `surfboard:///install-config?url=${encodeURIComponent(url + '&flag=surfboard')}`,
                        'quantumult-x': `quantumult-x:///update-configuration?remote-resource=${encodeURIComponent(JSON.stringify({ resources: [{ tag: 'remote', url: url + '&flag=quantumult%20x' }] }))}`,
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
                      className="flex items-center justify-center gap-1.5 px-3 py-3 text-sm font-medium bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-lg hover:from-indigo-500 hover:to-indigo-400 transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 min-h-[44px]"
                    >
                      {item.name}
                    </button>
                  ) : (
                    <a
                      key={item.id}
                      href={item.href}
                      className="flex items-center justify-center gap-1.5 px-3 py-3 text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-gray-400 min-h-[44px]"
                    >
                      <img src={`/${item.id === 'quantumult-x' ? 'qx' : item.id}.${item.id === 'surfboard' ? 'avif' : 'png'}`} alt="" className="w-4 h-4" />
                      <span>{item.name}</span>
                    </a>
                  )
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500 dark:text-gray-400">{t.dashboard.purchase.needSubscription}</p>
            <a href="/product" className="mt-4 inline-block px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-lg hover:from-indigo-500 hover:to-indigo-400 transition-colors">
              {t.dashboard.purchase.purchaseNow}
            </a>
          </div>
        )}
      </div>
    </div>
  );
} 