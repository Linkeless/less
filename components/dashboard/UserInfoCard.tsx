'use client';
import { useState } from 'react';
import type { UserInfoResponse } from '@/lib/types';
import type { TranslationValues } from '@/lib/i18n/context';
import { formatBytes } from '@/lib/api'; // For formatting forwarding traffic

interface UserInfoCardProps {
  userInfo: UserInfoResponse | null;
  loadingUserInfo: boolean;
  t: TranslationValues;
  planIdAllowed: boolean; // Derived from userInfo and env, passed as prop
  forwardingUser: any | null; // From state in parent
  onEnableForwarding: () => Promise<void>; // Handler from parent
  onSyncForwardingUser: () => Promise<void>; // Handler from parent
  // getForwardUsers, setForwardingUser, setForwardingEnabled are removed as page reload handles refresh
}

export default function UserInfoCard({
  userInfo,
  loadingUserInfo,
  t,
  planIdAllowed,
  forwardingUser,
  onEnableForwarding, // Will cause page reload
  onSyncForwardingUser,
}: UserInfoCardProps) {
  const [showUUID, setShowUUID] = useState(false);

  const handleActivateForwarding = async () => {
    await onEnableForwarding(); // Parent will reload the page
    // No need for further state updates here as the page will refresh
  };

  if (loadingUserInfo) {
    return (
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative flex h-full flex-col overflow-hidden rounded-2xl bg-white dark:bg-gray-800">
          <div className="px-8 pt-8 pb-3 sm:px-10">
            <div className="mb-8">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 leading-7">
                {t.dashboard.userInfo}
              </h2>
            </div>
            <div className="mt-6 flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!userInfo || userInfo.status !== 'success') {
    return (
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative flex h-full flex-col overflow-hidden rounded-2xl bg-white dark:bg-gray-800">
          <div className="px-8 pt-8 pb-3 sm:px-10">
            <div className="mb-8">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 leading-7">
                {t.dashboard.userInfo}
              </h2>
            </div>
            <p className="text-sm text-gray-500 text-center py-8">Failed to load user information</p>
          </div>
        </div>
      </div>
    );
  }

  const userData = userInfo.data;

  return (
    <div className="relative group">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
      <div className="relative flex h-full flex-col overflow-hidden rounded-2xl bg-white dark:bg-gray-800">
        <div className="px-8 pt-8 pb-3 sm:px-10">
          <div className="mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 leading-7">
              {t.dashboard.userInfo}
            </h2>
          </div>

          <div className="mt-6 space-y-6">
            {/* UUID Card */}
            <div className="rounded-xl bg-gradient-to-br from-indigo-50 dark:from-indigo-950 to-white dark:to-gray-800 p-4 shadow-sm ring-1 ring-gray-950/5 dark:ring-white/5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-base sm:text-sm font-semibold text-gray-700 dark:text-gray-300">UUID</p>
                <button
                  onClick={() => setShowUUID(!showUUID)}
                  className="inline-flex items-center gap-x-1.5 rounded-md bg-gradient-to-br from-indigo-50 dark:from-indigo-950 to-white dark:to-gray-800 px-2.5 py-1.5 text-xs font-medium text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  {showUUID ? t.dashboard.uuid.hide : t.dashboard.uuid.show}
                </button>
              </div>
              <p className="text-base sm:text-sm font-medium text-gray-900 dark:text-gray-100 tracking-wide break-all font-mono">
                {showUUID ? userData.uuid : '••••••••-••••-••••-••••-••••••••••••'}
              </p>
            </div>

            {/* Balance Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-gradient-to-br from-indigo-50 dark:from-indigo-950 to-white dark:to-gray-800 p-4 shadow-sm ring-1 ring-gray-950/5 dark:ring-white/5">
                <p className="text-base sm:text-sm font-semibold text-gray-700 dark:text-gray-300">{t.dashboard.balance}</p>
                <p className="mt-2 text-xl sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                  ¥{(userData.balance / 100).toFixed(2)}
                </p>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-indigo-50 dark:from-indigo-950 to-white dark:to-gray-800 p-4 shadow-sm ring-1 ring-gray-950/5 dark:ring-white/5">
                <p className="text-base sm:text-sm font-semibold text-gray-700 dark:text-gray-300">{t.dashboard.commission}</p>
                <p className="mt-2 text-xl sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                  ¥{(userData.commission_balance / 100).toFixed(2)}
                </p>
              </div>
            </div>
            
            {/* User Details Card */}
            <div className="rounded-xl bg-gradient-to-br from-gray-50 dark:from-gray-900 to-white dark:to-gray-800 p-4 space-y-3 shadow-sm ring-1 ring-gray-950/5 dark:ring-white/5">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-600 dark:text-gray-400">{t.dashboard.memberSince}</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {new Date(userData.created_at * 1000).toLocaleDateString()}
                </span>
              </div>
              {userData.telegram_id && (
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-600 dark:text-gray-400">{t.common.telegram}</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{t.common.connected}</span>
                </div>
              )}
            </div>

            {/* Forwarding Info Card */}
            {(planIdAllowed || forwardingUser) && (
              <div className="rounded-xl bg-gradient-to-br from-gray-50 dark:from-gray-900 to-white dark:to-gray-800 p-4 shadow-sm ring-1 ring-gray-950/5 dark:ring-white/5">
                <h3 className="text-base sm:text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">端口转发</h3>
                {forwardingUser ? ((() => {
                  const now = Math.floor(Date.now() / 1000);
                  const isExpired = forwardingUser.expire < now;
                  return (
                    <>
                      <div className="flex flex-row items-center justify-between gap-2 mb-4">
                        <div>
                          {isExpired ? (
                            <span className="inline-flex items-center px-4 py-1.5 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold text-base">
                              已过期
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-4 py-1.5 rounded-lg bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 font-semibold text-base">
                              已激活
                            </span>
                          )}
                        </div>
                        <button
                          className="inline-flex items-center px-4 py-1.5 rounded-lg bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 transition"
                          onClick={onSyncForwardingUser}
                          type="button"
                        >
                          同步
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-1">
                          <div className="text-xs sm:text-xs text-gray-500 dark:text-gray-400">到期时间</div>
                          <div className="font-mono text-sm text-gray-900 dark:text-gray-100">{new Date(forwardingUser.expire * 1000).toLocaleString()}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs sm:text-xs text-gray-500 dark:text-gray-400">套餐用量</div>
                          <div className="font-mono text-sm text-gray-900 dark:text-gray-100">{
                            String((() => {
                              const bytes = forwardingUser.traffic_enable;
                              if (bytes >= 1024 * 1024 * 1024 * 1024) return (bytes / (1024 * 1024 * 1024 * 1024)).toFixed(2) + ' TB';
                              if (bytes >= 1024 * 1024 * 1024) return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
                              if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
                              if (bytes >= 1024) return (bytes / 1024).toFixed(2) + ' KB';
                              return bytes + ' B';
                            })())
                          }</div>
                        </div>
                      </div>
                      <div className="mb-2 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>转发流量使用情况</span>
                        <span>
                          {formatBytes(forwardingUser.traffic_used || 0)} / {formatBytes(forwardingUser.traffic_enable || 0)}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden mb-1">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-indigo-500 dark:from-indigo-500 dark:to-indigo-400 transition-all duration-300"
                          style={{
                            width: `${Math.min(
                              ((forwardingUser.traffic_used || 0) / (forwardingUser.traffic_enable || 1)) * 100,
                              100
                            )}%`
                          }}
                        />
                      </div>
                      <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                        {(
                          (forwardingUser.traffic_used || 0) /
                          (forwardingUser.traffic_enable || 1) *
                          100
                        ).toFixed(1)}% 已用
                      </div>
                    </>
                  );
                })()) : (
                  <button
                    className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 px-4 py-2 text-base font-semibold text-white shadow-lg hover:scale-105 active:scale-95 transition focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2"
                    onClick={handleActivateForwarding}
                  >
                    激活
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 