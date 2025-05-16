'use client';
import { BellIcon } from '@heroicons/react/24/outline'
import { useState, useMemo } from 'react' 
import { useLanguage } from '@/lib/i18n/hooks';
import TitleBar from '@/components/TitleBar'
import SignOutButton from '@/components/SignOutButton';
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

  return (
    <>
      <style jsx global>{globalStyles}</style>
      <div className="min-h-[100dvh] flex flex-col bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 font-sans antialiased">
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
            user={userDisplay}
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

          <main className="flex-1 leading-relaxed">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
              <div className="grid gap-6 lg:grid-cols-2">
                <SubscriptionCard 
                  subscription={subscription}
                  loading={loadingSubscription}
                  userInfo={userInfo}
                  t={t}
                  handleCopyUrl={handleCopyUrl}
                />

                <UserInfoCard 
                  userInfo={userInfo}
                  loadingUserInfo={loadingUserInfo}
                  t={t}
                  planIdAllowed={isForwardingAllowedForPlan}
                  forwardingUser={forwardingUser}
                  onEnableForwarding={handleEnableForwarding}
                  onSyncForwardingUser={handleSyncForwardingUser}
                />

                <TrafficStatsCard 
                  trafficLog={trafficLog}
                  loadingTraffic={loadingTrafficLog}
                  isMobile={isMobile}
                  t={t}
                />

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
