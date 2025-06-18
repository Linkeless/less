'use client';
import { BellIcon, ChartBarIcon, UserIcon, CogIcon, ArrowTrendingUpIcon, CreditCardIcon, ServerIcon } from '@heroicons/react/24/outline'
import { useState, useMemo } from 'react' 
import { useLanguage } from '@/lib/i18n/hooks';
import TitleBar from '@/components/layout/title-bar'
import SignOutButton from '@/components/auth/sign-out-button';
import SubscriptionCard from '@/components/dashboard/SubscriptionCard';
import UserInfoCard from '@/components/dashboard/UserInfoCard';
import TrafficStatsCard from '@/components/dashboard/TrafficStatsCard';
import SubscriptionRequestsCard from '@/components/dashboard/SubscriptionRequestsCard';
import ResetUUIDDialog from '@/components/dashboard/dialogs/ResetUUIDDialog';
import CopyNotification from '@/components/dashboard/dialogs/CopyNotification';
import NoticesDialog from '@/components/dashboard/dialogs/NoticesDialog';
import PopupNoticeDialog from '@/components/dashboard/dialogs/PopupNoticeDialog';
import {
  getGravatarUrl,
  copyToClipboard,
} from '@/lib/utils';
import { useUserData } from '@/hooks/useUserData';
import { useNoticeData } from '@/hooks/useNoticeData';
import { useForwardingData } from '@/hooks/useForwardingData';
import { usePageSetup } from '@/hooks/usePageSetup';
import { useTimedToggle } from '@/hooks/useTimedToggle';

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

export default function Dashboard() {
  const { t } = useLanguage();

  const {
    userInfo,
    loadingUserInfo,
    subscription,
    loadingSubscription,
    trafficLog,
    loadingTrafficLog,
    handleResetUUID,
  } = useUserData();

  const {
    notices,
    loadingNotices,
    showNotices,
    setShowNotices,
    popupNotice,
    showPopupNotice,
    setShowPopupNotice,
  } = useNoticeData();

  const {
    forwardingUser,
    isForwardingAllowedForPlan,
    loadingForwardingData,
    handleEnableForwarding,
    handleSyncForwardingUser,
  } = useForwardingData({ userInfo: userInfo?.data ?? null, isUserInfoLoading: loadingUserInfo });

  const { isMobile } = usePageSetup({ userInfo, loadingUserInfo });

  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)
  const [showCopyNotification, triggerCopyNotification] = useTimedToggle(2000);

  const userDisplay = useMemo(() => ({
    name: userInfo ? userInfo.data.email.split('@')[0] : 'User',
    email: userInfo ? userInfo.data.email : '',
    imageUrl: userInfo ? getGravatarUrl(userInfo.data.email) : getGravatarUrl(''),
  }), [userInfo]);

  const handleCopyUrl = async (url: string) => {
    const success = await copyToClipboard(url)
    if (success) {
      triggerCopyNotification();
    }
  }

  const navigation = useMemo(() => [
    { name: t.common.dashboard, href: '#', current: true },
    ...(forwardingUser ? [{ name: t.forwardingRules.title, href: '/forwarding-rules', current: false }] : []),
    { name: t.common.product, href: '/product', current: false },
    { name: t.common.orders, href: '/orders', current: false },
    { name: t.invite.title, href: '/invite', current: false },
  ], [t, forwardingUser]);

  const userNavigation = [
    { name: t.common.signOut, component: <SignOutButton /> }
  ]

  // Calculate current time greeting
  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return '夜深了';
    if (hour < 12) return '早上好';
    if (hour < 18) return '下午好';
    return '晚上好';
  };

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
          <TitleBar 
            user={userDisplay}
            navigation={navigation}
            userNavigation={userNavigation}
            showLanguageSwitch={true}
            rightExtra={
              <button
                className="relative rounded-full p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200 min-h-[40px] min-w-[40px]"
                onClick={() => setShowNotices(true)}
                aria-label="查看通知"
              >
                <BellIcon className="size-5" />
                {notices.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex size-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full size-3 bg-yellow-500"></span>
                  </span>
                )}
              </button>
            }
          />

          <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-12">

            {/* Main Dashboard Content */}
            <div className="space-y-6 sm:space-y-16">
              {/* Top Row - Subscription and User Info */}
              <div className="grid grid-cols-1 gap-6 sm:gap-12 lg:gap-16 lg:grid-cols-2">
                {/* Subscription Details */}
                <div className="order-1 lg:order-1">
                  <div className="mb-4 sm:mb-8 border-b border-gray-200 dark:border-gray-700 pb-3 sm:pb-5">
                    <h3 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white leading-tight">订阅详情</h3>
                    <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">您的订阅配置和使用情况</p>
                  </div>
                  <SubscriptionCard 
                    subscription={subscription}
                    loading={loadingSubscription}
                    userInfo={userInfo}
                    t={t}
                    handleCopyUrl={handleCopyUrl}
                  />
                </div>

                {/* User Information */}
                <div className="order-2 lg:order-2">
                  <div className="mb-4 sm:mb-8 border-b border-gray-200 dark:border-gray-700 pb-3 sm:pb-5">
                    <h3 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white leading-tight">账户信息</h3>
                    <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">您的个人资料和设置</p>
                  </div>
                  <UserInfoCard 
                    userInfo={userInfo}
                    loadingUserInfo={loadingUserInfo}
                    t={t}
                    planIdAllowed={isForwardingAllowedForPlan}
                    forwardingUser={forwardingUser}
                    onEnableForwarding={handleEnableForwarding}
                    onSyncForwardingUser={handleSyncForwardingUser}
                  />
                </div>
              </div>

              {/* Second Row - Traffic Analytics */}
              <div className="order-3">
                <div className="mb-4 sm:mb-8 border-b border-gray-200 dark:border-gray-700 pb-3 sm:pb-5">
                  <h3 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white leading-tight">流量分析</h3>
                  <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">详细的流量使用统计图表</p>
                </div>
                <TrafficStatsCard 
                  trafficLog={trafficLog}
                  loadingTraffic={loadingTrafficLog}
                  isMobile={isMobile}
                  t={t}
                />
              </div>

              {/* Third Row - Recent Activity (Full Width) */}
              <div className="order-4">
                <div className="mb-4 sm:mb-8 border-b border-gray-200 dark:border-gray-700 pb-3 sm:pb-5">
                  <h3 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white leading-tight">最近活动</h3>
                  <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">订阅请求和使用记录</p>
                </div>
                <SubscriptionRequestsCard
                  subscription={subscription?.data ?? null}
                  loading={loadingSubscription}
                  t={t}
                />
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Reset UUID Dialog */}
      <ResetUUIDDialog 
        isOpen={isResetDialogOpen}
        onClose={() => setIsResetDialogOpen(false)}
        onConfirm={async () => { 
            await handleResetUUID(); 
            setIsResetDialogOpen(false);
        }}
        t={t}
      />

      {/* Copy Notification */}
      <CopyNotification 
          show={showCopyNotification}
        t={t} 
      />

      {/* 通知弹窗 */}
      <NoticesDialog 
        isOpen={showNotices}
        onClose={() => setShowNotices(false)}
        notices={notices}
        t={t}
      />

      {/* 通知弹窗（自动弹窗，仅显示 tags 含"弹窗"的一条） */}
      <PopupNoticeDialog 
        isOpen={showPopupNotice}
        onClose={() => setShowPopupNotice(false)}
        notice={popupNotice}
        t={t}
      />
    </>
  )
}
