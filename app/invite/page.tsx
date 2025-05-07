'use client';
import { useState } from 'react';
import { ClipboardIcon, CheckIcon, UsersIcon, ArrowTrendingUpIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import TitleBar from '@/components/TitleBar';
import { useLanguage } from '@/lib/i18n/hooks';
import { useInviteData } from '@/hooks/useInviteData';

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
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
        <p className="text-gray-700 dark:text-gray-300">{t.common.loading}...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
        <p className="text-red-500 dark:text-red-400">Error: {error}</p>
      </div>
    );
  }

  return (
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
        <TitleBar user={user} navigation={navigation} userNavigation={userNavigation} showLanguageSwitch={true} />
        <main className="flex-1">
          <div className="mx-auto w-full max-w-3xl px-2 py-4 sm:px-6 lg:px-8">
            <div className="grid gap-6">
              {/* 统计卡片：所有屏幕三列横排，无横向滚动条 */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                {/* 邀请人数 */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex flex-col items-center text-center">
                  <div className="mb-2 flex items-center justify-center h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900">
                    <UsersIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{stat[0] ?? 0}</div>
                  <div className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">{t.invite.invitedCount}</div>
                </div>
                {/* 佣金比例 */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex flex-col items-center text-center">
                  <div className="mb-2 flex items-center justify-center h-10 w-10 rounded-full bg-green-100 dark:bg-green-900">
                    <ArrowTrendingUpIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stat[3] ? `${stat[3]}%` : '--'}</div>
                  <div className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">佣金比例</div>
                </div>
                {/* 累计佣金 */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex flex-col items-center text-center">
                  <div className="mb-2 flex items-center justify-center h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-900">
                    <CurrencyDollarIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">¥{stat[1] ? (stat[1] / 100).toFixed(2) : '0.00'}</div>
                  <div className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">{t.invite.rewardTotal}</div>
                </div>
              </div>
              {/* 所有邀请码卡片 */}
              {codes.length > 0 && (
                <div className="relative group">
                  <div className="relative rounded-2xl bg-white dark:bg-gray-800 ring-1 ring-gray-950/5 dark:ring-white/5 overflow-hidden p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-2 sm:gap-0">
                      <div className="text-gray-700 dark:text-gray-200 font-medium text-xs sm:text-base">{t.invite.myCodes}：</div>
                      <button
                        onClick={handleCreateInvite}
                        disabled={creating}
                        className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 dark:bg-indigo-500 dark:hover:bg-indigo-400 px-3 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm transition disabled:opacity-60 disabled:cursor-not-allowed w-full sm:w-auto mt-2 sm:mt-0 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                      >
                        {creating ? (
                          <svg className="animate-spin h-4 w-4 mr-1" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                        ) : null}
                        生成邀请码
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                      {codes.map((c, i) => (
                        <span key={c.code} className="flex items-center gap-1 px-2 sm:px-3 py-1 rounded bg-indigo-100 dark:bg-indigo-700 text-indigo-700 dark:text-indigo-200 text-xs sm:text-sm font-mono break-all">
                          {c.code}
                          <button
                            onClick={() => handleCopy(`${typeof window !== 'undefined' ? window.location.origin : ''}/register?invite_code=${c.code}`)}
                            className="ml-1 p-1 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 text-white hover:from-indigo-500 hover:to-indigo-400 transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                            title={t.invite.copy}
                          >
                            {copiedCode === `${typeof window !== 'undefined' ? window.location.origin : ''}/register?invite_code=${c.code}` ? (
                              <CheckIcon className="w-4 h-4 text-green-500" />
                            ) : (
                              <ClipboardIcon className="w-4 h-4 text-white" />
                            )}
                          </button>
                          {copiedCode === `${typeof window !== 'undefined' ? window.location.origin : ''}/register?invite_code=${c.code}` && <span className="ml-1 text-green-500 text-xs">{t.invite.copied}</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {/* 佣金发放记录表格卡片 */}
              <div className="overflow-x-auto mt-4 sm:mt-8">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead>
                    <tr>
                      <th className="whitespace-nowrap py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">订单号</th>
                      <th className="whitespace-nowrap px-3 py-3.5 text-left text-sm font-semibold text-gray-900">订单金额</th>
                      <th className="whitespace-nowrap px-3 py-3.5 text-left text-sm font-semibold text-gray-900">获得佣金</th>
                      <th className="whitespace-nowrap px-3 py-3.5 text-left text-sm font-semibold text-gray-900">发放时间</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {loadingRecords ? (
                      <tr>
                        <td colSpan={4} className="py-4 pl-4 pr-3 text-sm text-center text-gray-500 sm:pl-6">
                          加载中...
                        </td>
                      </tr>
                    ) : commissionRecords.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-4 pl-4 pr-3 text-sm text-center text-gray-500 sm:pl-6">
                          暂无记录
                        </td>
                      </tr>
                    ) : (
                      commissionRecords.map((rec) => (
                        <tr key={rec.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900 sm:pl-6">{rec.trade_no}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">¥{(rec.order_amount / 100).toFixed(2)}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-green-600">¥{(rec.get_amount / 100).toFixed(2)}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{new Date(rec.created_at * 1000).toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 