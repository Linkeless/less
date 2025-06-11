'use client';
import { useState } from 'react';
import { ClipboardIcon, CheckIcon, UsersIcon, ArrowTrendingUpIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import TitleBar from '@/components/TitleBar';
import { useLanguage } from '@/lib/i18n/hooks';
import { useInviteData } from '@/hooks/useInviteData';

// Add global styles at the top - THIS SHOULD BE RETAINED
const globalStyles = `
  ::-webkit-scrollbar {
    display: none;
  }
  * {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

export default function InvitePage() {
  const { t } = useLanguage();
  const {
    codes,
    stat,
    user,
    commissionRecords,
    loading,
    loadingRecords,
    creating,
    error,
    handleCreateInvite,
  } = useInviteData();

  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const inviteLink = codes[0]?.code
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/register?invite_code=${codes[0].code}`
    : '';

  const handleCopy = async (text: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(text);
      setTimeout(() => setCopiedCode(null), 1500);
    } catch {
      // ignore
    }
  };

  const navigation = [
    { name: t.common.dashboard, href: '/dashboard', current: false },
    { name: t.common.product, href: '/product', current: false },
    { name: t.common.orders, href: '/orders', current: false },
    { name: t.invite.title, href: '/invite', current: true },
  ];
  const userNavigation = [
    { name: t.common.signOut, href: '/logout' },
  ];

  if (loading) {
    return (
      <>
        <style jsx global>{globalStyles}</style>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 relative">
          {/* Grid Background */}
          <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]" style={{
            backgroundImage: `
              linear-gradient(rgb(0, 0, 0) 1px, transparent 1px),
              linear-gradient(90deg, rgb(0, 0, 0) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px'
          }}></div>
          <div className="relative z-10 flex items-center justify-center min-h-screen">
            <p className="text-gray-700 dark:text-gray-300">{t.common.loading}...</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <style jsx global>{globalStyles}</style>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 relative">
          {/* Grid Background */}
          <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]" style={{
            backgroundImage: `
              linear-gradient(rgb(0, 0, 0) 1px, transparent 1px),
              linear-gradient(90deg, rgb(0, 0, 0) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px'
          }}></div>
          <div className="relative z-10 flex items-center justify-center min-h-screen">
            <p className="text-red-500 dark:text-red-400">Error: {error}</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style jsx global>{globalStyles}</style>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 relative">
        {/* Grid Background */}
        <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]" style={{
          backgroundImage: `
            linear-gradient(rgb(0, 0, 0) 1px, transparent 1px),
            linear-gradient(90deg, rgb(0, 0, 0) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }}></div>
        <div className="relative z-10">
          <TitleBar user={user} navigation={navigation} userNavigation={userNavigation} showLanguageSwitch={true} />
          
          <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
            <div className="space-y-8 sm:space-y-16">
              {/* 邀请统计 */}
              <div className="order-1">
                <div className="mb-6 sm:mb-8 border-b border-gray-200 dark:border-gray-700 pb-4 sm:pb-5">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white leading-tight">邀请统计</h3>
                  <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">您的邀请成果和收益概览</p>
                </div>
                
                {/* 统计卡片：三列横排 */}
                <div className="grid grid-cols-3 gap-3 sm:gap-6">
                  {/* 邀请人数 */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-center sm:items-center">
                      <div className="flex-shrink-0 mb-2 sm:mb-0">
                        <div className="flex items-center justify-center h-8 w-8 sm:h-12 sm:w-12 rounded-lg bg-indigo-100 dark:bg-indigo-900">
                          <UsersIcon className="h-4 w-4 sm:h-6 sm:w-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                      </div>
                      <div className="sm:ml-4 text-center sm:text-left">
                        <div className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{stat[0] ?? 0}</div>
                        <div className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">{t.invite.invitedCount}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 佣金比例 */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-center sm:items-center">
                      <div className="flex-shrink-0 mb-2 sm:mb-0">
                        <div className="flex items-center justify-center h-8 w-8 sm:h-12 sm:w-12 rounded-lg bg-green-100 dark:bg-green-900">
                          <ArrowTrendingUpIcon className="h-4 w-4 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
                        </div>
                      </div>
                      <div className="sm:ml-4 text-center sm:text-left">
                        <div className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{stat[3] ? `${stat[3]}%` : '--'}</div>
                        <div className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">佣金比例</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 累计佣金 */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-center sm:items-center">
                      <div className="flex-shrink-0 mb-2 sm:mb-0">
                        <div className="flex items-center justify-center h-8 w-8 sm:h-12 sm:w-12 rounded-lg bg-yellow-100 dark:bg-yellow-900">
                          <CurrencyDollarIcon className="h-4 w-4 sm:h-6 sm:w-6 text-yellow-600 dark:text-yellow-400" />
                        </div>
                      </div>
                      <div className="sm:ml-4 text-center sm:text-left">
                        <div className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">¥{stat[1] ? (stat[1] / 100).toFixed(2) : '0.00'}</div>
                        <div className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">{t.invite.rewardTotal}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 邀请码管理 */}
              {codes.length > 0 && (
                <div className="order-2">
                  <div className="mb-6 sm:mb-8 border-b border-gray-200 dark:border-gray-700 pb-4 sm:pb-5">
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white leading-tight">邀请码管理</h3>
                    <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">生成和管理您的专属邀请码</p>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4 sm:gap-0">
                      <div className="text-gray-900 dark:text-white font-medium">{t.invite.myCodes}：</div>
                      <button
                        onClick={handleCreateInvite}
                        disabled={creating}
                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400 px-4 py-2 text-sm font-semibold text-white shadow-sm transition disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                      >
                        {creating ? (
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                          </svg>
                        ) : null}
                        生成邀请码
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {codes.map((c, i) => (
                        <div key={c.code} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-sm text-gray-900 dark:text-white break-all">{c.code}</span>
                            <button
                              onClick={() => handleCopy(`${typeof window !== 'undefined' ? window.location.origin : ''}/register?invite_code=${c.code}`)}
                              className="ml-2 p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-700"
                              title={t.invite.copy}
                            >
                              {copiedCode === `${typeof window !== 'undefined' ? window.location.origin : ''}/register?invite_code=${c.code}` ? (
                                <CheckIcon className="w-4 h-4 text-green-500" />
                              ) : (
                                <ClipboardIcon className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                          {copiedCode === `${typeof window !== 'undefined' ? window.location.origin : ''}/register?invite_code=${c.code}` && (
                            <div className="mt-2 text-green-500 text-xs">{t.invite.copied}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 佣金记录 */}
              <div className="order-3">
                <div className="mb-6 sm:mb-8 border-b border-gray-200 dark:border-gray-700 pb-4 sm:pb-5">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white leading-tight">佣金记录</h3>
                  <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">详细的佣金发放历史记录</p>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="whitespace-nowrap py-3.5 pl-6 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white">订单号</th>
                          <th className="whitespace-nowrap px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">订单金额</th>
                          <th className="whitespace-nowrap px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">获得佣金</th>
                          <th className="whitespace-nowrap px-3 py-3.5 pr-6 text-left text-sm font-semibold text-gray-900 dark:text-white">发放时间</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                        {loadingRecords ? (
                          <tr>
                            <td colSpan={4} className="py-8 pl-6 pr-3 text-sm text-center text-gray-500 dark:text-gray-400">
                              加载中...
                            </td>
                          </tr>
                        ) : commissionRecords.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-8 pl-6 pr-3 text-sm text-center text-gray-500 dark:text-gray-400">
                              暂无记录
                            </td>
                          </tr>
                        ) : (
                          commissionRecords.map((rec) => (
                            <tr key={rec.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                              <td className="whitespace-nowrap py-4 pl-6 pr-3 text-sm text-gray-900 dark:text-white">{rec.trade_no}</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-white">¥{(rec.order_amount / 100).toFixed(2)}</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-green-600 dark:text-green-400">¥{(rec.get_amount / 100).toFixed(2)}</td>
                              <td className="whitespace-nowrap px-3 py-4 pr-6 text-sm text-gray-500 dark:text-gray-400">{new Date(rec.created_at * 1000).toLocaleString()}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
} 