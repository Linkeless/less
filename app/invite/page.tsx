'use client';
import { useEffect, useState } from 'react';
import { getInviteInfo, getUserInfo, createInviteCode, getInviteCommissionRecords } from '@/lib/actions';
import { ClipboardIcon, CheckIcon, UsersIcon, ArrowTrendingUpIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import TitleBar from '@/components/TitleBar';
import md5 from 'md5';
import { useLanguage } from '@/lib/i18n/hooks';

export default function InvitePage() {
  const [codes, setCodes] = useState<{ code: string }[]>([]);
  const [stat, setStat] = useState<number[]>([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<{ name: string; email: string; imageUrl: string }>({ name: '', email: '', imageUrl: '' });
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [commissionRecords, setCommissionRecords] = useState<any[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [inviteRes, userRes, recordsRes] = await Promise.all([
          getInviteInfo(),
          getUserInfo(),
          getInviteCommissionRecords(),
        ]);
        setCodes(inviteRes.data.codes || []);
        setStat(inviteRes.data.stat || []);
        setCommissionRecords(recordsRes.data || []);
        setLoadingRecords(false);
        if (userRes.status === 'success' && userRes.data) {
          const email = userRes.data.email;
          const name = email.split('@')[0];
          const imageUrl = userRes.data.avatar_url || `https://www.gravatar.com/avatar/${md5(email.trim().toLowerCase())}?s=256&d=monsterid`;
          setUser({ name, email, imageUrl });
        }
      } catch (err: any) {
        setError(err.message || '加载失败');
        setLoadingRecords(false);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

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

  // 生成邀请码
  const handleCreateInvite = async () => {
    setCreating(true);
    try {
      await createInviteCode();
      // 重新拉取邀请码列表
      const res = await getInviteInfo();
      setCodes(res.data.codes || []);
      setStat(res.data.stat || []);
    } catch (err: any) {
      setError(err.message || '生成邀请码失败');
    } finally {
      setCreating(false);
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
          <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="grid gap-8 sm:gap-8">
              {/* 邀请链接卡片 */}
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative flex flex-col overflow-hidden rounded-2xl sm:rounded-2xl bg-white dark:bg-gray-800 shadow-lg p-4 sm:p-8">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">{t.invite.title}</h2>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-2">
                    <span className="text-gray-700 dark:text-gray-200 font-medium whitespace-nowrap">{t.invite.link}：</span>
                    <input
                      className="flex-1 bg-transparent border-none outline-none text-indigo-600 dark:text-indigo-400 font-mono text-sm truncate"
                      value={inviteLink}
                      readOnly
                    />
                    <button
                      onClick={() => handleCopy(inviteLink)}
                      className="sm:ml-2 p-2 rounded hover:bg-indigo-100 dark:hover:bg-indigo-700 transition"
                      title={t.invite.copy}
                    >
                      {copiedCode === inviteLink ? (
                        <CheckIcon className="w-5 h-5 text-green-500" />
                      ) : (
                        <ClipboardIcon className="w-5 h-5 text-gray-500 dark:text-gray-300" />
                      )}
                    </button>
                    {copiedCode === inviteLink && <span className="ml-2 text-green-500 text-xs">{t.invite.copied}</span>}
                  </div>
                </div>
              </div>
              {/* 统计卡片+佣金比例 */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 sm:p-8">
                <dl className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  <div className="flex flex-col items-center text-center">
                    <dt className="mb-2 flex items-center justify-center h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900">
                      <UsersIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    </dt>
                    <dd className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{stat[0] ?? 0}</dd>
                    <dt className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">{t.invite.invitedCount}</dt>
                  </div>
                  <div className="flex flex-col items-center text-center border-t border-gray-200 dark:border-gray-700 sm:border-t-0 sm:border-l sm:border-r-0 sm:border-b-0">
                    <dt className="mb-2 flex items-center justify-center h-10 w-10 rounded-full bg-green-100 dark:bg-green-900">
                      <ArrowTrendingUpIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </dt>
                    <dd className="text-2xl font-bold text-green-600 dark:text-green-400">{stat[3] ? `${stat[3]}%` : '--'}</dd>
                    <dt className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">佣金比例</dt>
                  </div>
                  <div className="flex flex-col items-center text-center border-t border-gray-200 dark:border-gray-700 sm:border-t-0 sm:border-l">
                    <dt className="mb-2 flex items-center justify-center h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-900">
                      <CurrencyDollarIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                    </dt>
                    <dd className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">¥{stat[1] ? (stat[1] / 100).toFixed(2) : '0.00'}</dd>
                    <dt className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">{t.invite.rewardTotal}</dt>
                  </div>
                </dl>
              </div>
              {/* 所有邀请码卡片 */}
              {codes.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-2xl shadow-lg p-4 sm:p-8">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-gray-700 dark:text-gray-200 font-medium">{t.invite.myCodes}：</div>
                    <button
                      onClick={handleCreateInvite}
                      disabled={creating}
                      className="inline-flex items-center gap-1 rounded bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400 px-3 py-1.5 text-xs sm:text-sm font-semibold text-white transition disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {creating ? (
                        <svg className="animate-spin h-4 w-4 mr-1" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                      ) : null}
                      生成邀请码
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    {codes.map((c, i) => (
                      <span key={c.code} className="flex items-center gap-1 px-2 sm:px-3 py-1 rounded bg-indigo-100 dark:bg-indigo-700 text-indigo-700 dark:text-indigo-200 text-xs sm:text-sm font-mono">
                        {c.code}
                        <button
                          onClick={() => handleCopy(`${typeof window !== 'undefined' ? window.location.origin : ''}/register?invite_code=${c.code}`)}
                          className="ml-1 p-1 rounded hover:bg-indigo-200 dark:hover:bg-indigo-600 transition"
                          title={t.invite.copy}
                        >
                          {copiedCode === `${typeof window !== 'undefined' ? window.location.origin : ''}/register?invite_code=${c.code}` ? (
                            <CheckIcon className="w-4 h-4 text-green-500" />
                          ) : (
                            <ClipboardIcon className="w-4 h-4 text-gray-500 dark:text-gray-300" />
                          )}
                        </button>
                        {copiedCode === `${typeof window !== 'undefined' ? window.location.origin : ''}/register?invite_code=${c.code}` && <span className="ml-1 text-green-500 text-xs">{t.invite.copied}</span>}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {/* 佣金发放记录表格 */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-2xl shadow-lg p-4 sm:p-8 mt-8">
                <div className="text-gray-700 dark:text-gray-200 font-medium mb-4">佣金发放记录</div>
                {loadingRecords ? (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-8">加载中...</div>
                ) : commissionRecords.length === 0 ? (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-8">暂无记录</div>
                ) : (
                  <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                      <div className="overflow-hidden rounded-xl ring-1 ring-gray-200 dark:ring-gray-700">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-xs sm:text-sm">
                          <thead className="bg-gray-50 dark:bg-gray-900">
                            <tr>
                              <th scope="col" className="px-2 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">订单号</th>
                              <th scope="col" className="px-2 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">订单金额</th>
                              <th scope="col" className="px-2 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">获得佣金</th>
                              <th scope="col" className="px-2 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">发放时间</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
                            {commissionRecords.map((rec, idx) => (
                              <tr key={rec.id} className="hover:bg-gray-50 dark:hover:bg-gray-900 transition">
                                <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-mono text-gray-900 dark:text-gray-100">{rec.trade_no}</td>
                                <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-mono text-gray-900 dark:text-gray-100">¥{(rec.order_amount / 100).toFixed(2)}</td>
                                <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-mono text-green-600 dark:text-green-400">¥{(rec.get_amount / 100).toFixed(2)}</td>
                                <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-700 dark:text-gray-300">{new Date(rec.created_at * 1000).toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 