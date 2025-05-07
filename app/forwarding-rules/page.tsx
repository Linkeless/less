'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, ChevronLeftIcon, ChevronRightIcon, ClipboardIcon, CheckIcon, WrenchIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import RuleModal from './components/RuleModal';
import TitleBar from '@/components/TitleBar';
import { useLanguage } from '@/lib/i18n/hooks';
import { getForwardingRules, getDeviceGroups, createForwardingRule, diagnoseForwardingRule, deleteForwardingRules, getUserInfo, getForwardUsers, updateForwardingRule } from '@/lib/actions';

interface ForwardingRule {
  id: number;
  name: string;
  uid: number;
  listen_port: number;
  device_group_in: number;
  device_group_out: number;
  traffic_used: number;
  config: string;
  status: string;
  display_updated_at: string;
}

interface DeviceGroup {
  id: number;
  name: string;
  type: string;
  ratio: string;
  traffic_used: number;
  connect_host?: string;
  port_range?: string;
  config: string;
  show_order?: number;
  display_num?: number;
}

interface DeviceGroupInfo {
  name: string;
  connectHost: string | null;
  portRange: string | null;
}

export default function ForwardingRulesPage() {
  const { t } = useLanguage();

  const navigation = [
    { name: t.common.dashboard, href: '/dashboard', current: false },
    { name: t.forwardingRules.title, href: '/forwarding-rules', current: true },
    { name: t.common.product, href: '/product', current: false },
    { name: t.common.orders, href: '/orders', current: false },
    { name: t.invite.title, href: '/invite', current: false },

  ];

  const userNavigation = [
    { name: t.common.signOut, href: '/logout' },
  ];

  const [rules, setRules] = useState<ForwardingRule[]>([]);
  const [deviceGroups, setDeviceGroups] = useState<DeviceGroup[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ForwardingRule | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCopyToast, setShowCopyToast] = useState(false);
  const [copyTimeout, setCopyTimeout] = useState<NodeJS.Timeout | null>(null);
  const [initialData, setInitialData] = useState<{ source: string; destination: string; device_group_in: number; listen_port: number } | undefined>(undefined);

  const [diagnosisModalOpen, setDiagnosisModalOpen] = useState(false);
  const [diagnosisResult, setDiagnosisResult] = useState<string | null>(null);
  const [diagnosisLoading, setDiagnosisLoading] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingRuleId, setDeletingRuleId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [userInfo, setUserInfo] = useState<any>(null);
  const [noForwardingPermission, setNoForwardingPermission] = useState(false);
  const [forwardUser, setForwardUser] = useState<any>(null);

  const totalPages = Math.ceil(total / pageSize);

  // 全局变量，始终从 localStorage 读取
  const forwardUserId = typeof window !== 'undefined' ? Number(localStorage.getItem('forwardUserId')) : 0;

  useEffect(() => {
    const initializeForwardingAPI = async () => {
      try {
        setIsLoading(true);
        setError(null);
        // 先获取用户信息，检查 remarks
        const userInfoResp = await getUserInfo();
        setUserInfo(userInfoResp.data);
        // 检查是否已开启转发
        const usersRes = await getForwardUsers();
        if (usersRes.code !== 0 || !Array.isArray(usersRes.data)) {
          setNoForwardingPermission(true);
          setIsLoading(false);
          return;
        }
        const now = Math.floor(Date.now() / 1000);
        const existUser = usersRes.data.find((u: any) => u.username === userInfoResp.data.email && u.expire > now);
        if (!existUser) {
          setNoForwardingPermission(true);
          setIsLoading(false);
          return;
        }
        setForwardUser(existUser); // 存 forwardUser 以便 max_rules 使用
        // 存储 userId 到 localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('forwardUserId', String(existUser.id));
        }
      } catch (err) {
        setError('Error connecting to forwarding API');
        console.error('Error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeForwardingAPI();
  }, []);

  useEffect(() => {
    if (forwardUserId) {
      fetchRules();
    }
  }, [forwardUserId]);

  useEffect(() => {
    if (forwardUserId) {
      fetchDeviceGroups();
    }
  }, [forwardUserId]);

  const fetchRules = async (page = currentPage, size = pageSize) => {
    if (!forwardUserId) {
      setError('未获取到转发用户ID');
      return;
    }
    try {
      const response = await getForwardingRules(forwardUserId, page, size);
      if (response.code === 0) {
        setRules(response.data);
        setTotal(response.count);
      } else {
        setError('Failed to fetch forwarding rules');
      }
    } catch (err) {
      setError('Error fetching forwarding rules');
      console.error('Error:', err);
    }
  };

  const fetchDeviceGroups = async () => {
    if (!forwardUserId) {
      setError('未获取到转发用户ID');
      return;
    }
    try {
      const response = await getDeviceGroups(forwardUserId);
      if (response.code === 0) {
        setDeviceGroups(response.data);
      } else {
        setError('Failed to fetch device groups');
      }
    } catch (err) {
      setError('Error fetching device groups');
      console.error('Error:', err);
    }
  };

  const getDeviceGroupInfo = (id: number): DeviceGroupInfo => {
    const group = deviceGroups.find(g => g.id === id);
    if (!group) return { name: `Group ${id}`, connectHost: null, portRange: null };
    return {
      name: group.name,
      connectHost: group.connect_host || null,
      portRange: group.port_range || null
    };
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setShowCopyToast(true);
      if (copyTimeout) {
        clearTimeout(copyTimeout);
      }
      const timeout = setTimeout(() => {
        setShowCopyToast(false);
      }, 2000);
      setCopyTimeout(timeout);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleAddRule = async (ruleData: { source: string; destination: string; device_group_in: number; listen_port?: number }) => {

    if (!forwardUserId) {
      setError('未获取到转发用户ID');
      return;
    }
    try {
      const addresses = ruleData.destination.split('\n').filter(line => line.trim());
      const data: any = {
        name: ruleData.source,
        device_group_in: ruleData.device_group_in,
        device_group_out: null,
        config: JSON.stringify({ dest: addresses })
      };
      if (typeof ruleData.listen_port === 'number') {
        data.listen_port = ruleData.listen_port;
      }
      const response = await createForwardingRule(forwardUserId, data);

      if (response.code === 0) {
        // 刷新规则列表
        await fetchRules();
        setIsModalOpen(false);
      } else if (response.code === 500) {
        window.alert(response.msg);
      } else {
        setError(response.msg || 'Failed to create rule');
      }
    } catch (err) {
      setError('Error creating forwarding rule');
      console.error('Error:', err);
    }
  };

  const handleEditRule = async (ruleData: { source: string; destination: string; device_group_in: number; listen_port?: number }) => {
    if (!editingRule) {
      setError('No rule selected');
      return;
    }

    if (!forwardUserId) {
      setError('未获取到转发用户ID');
      return;
    }
    try {
      const addresses = ruleData.destination.split('\n').filter(line => line.trim());
      const data: any = {
        name: ruleData.source,
        device_group_in: ruleData.device_group_in,
        device_group_out: null,
        config: JSON.stringify({ dest: addresses })
      };
      if (typeof ruleData.listen_port === 'number') {
        data.listen_port = ruleData.listen_port;
      }
      const response = await updateForwardingRule(forwardUserId, editingRule.id, data);

      if (response.code === 0) {
        // 刷新规则列表
        await fetchRules();
        setEditingRule(null);
        setIsModalOpen(false);
      } else if (response.code === 500) {
        window.alert(response.msg);
      } else {
        setError(response.msg || 'Failed to update rule');
      }
    } catch (err) {
      setError('Error updating forwarding rule');
      console.error('Error:', err);
    }
  };

  const handleDeleteRule = (id: number) => {
    setDeletingRuleId(id);
    setShowDeleteModal(true);
  };

  const confirmDeleteRule = async () => {
    if (deletingRuleId == null) return;
    setDeleteLoading(true);
    try {
      const res = await deleteForwardingRules(forwardUserId, [deletingRuleId]);
      if (res.code === 0) {
        await fetchRules();
        setShowDeleteModal(false);
        setDeletingRuleId(null);
      } else {
        alert(res.msg || '删除失败');
      }
    } catch (e) {
      alert('删除失败');
    } finally {
      setDeleteLoading(false);
    }
  };

  const openEditModal = (rule: ForwardingRule) => {
    setEditingRule(rule);
    setInitialData({
      source: rule.name,
      destination: JSON.parse(rule.config).dest?.join('\n'),
      device_group_in: rule.device_group_in,
      listen_port: rule.listen_port
    });
    setIsModalOpen(true);
  };

  const handlePageChange = async (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    if (userInfo) {
      await fetchRules(newPage, pageSize);
    }
  };

  const handleDiagnose = async (ruleId: number) => {
    
    setDiagnosisLoading(true);
    setDiagnosisModalOpen(true);
    setDiagnosisResult(null);
    
    try {
      const response = await diagnoseForwardingRule(forwardUserId, ruleId);
      if (response.code === 0) {
        setDiagnosisResult(response.msg);
      } else {
        setDiagnosisResult(`${t.forwardingRules.diagnosisFailed} ${response.msg}`);
      }
    } catch (error) {
      setDiagnosisResult(t.forwardingRules.diagnosisRequestFailed);
    } finally {
      setDiagnosisLoading(false);
    }
  };

  // Add handler for page size change
  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = parseInt(e.target.value, 10);
    setPageSize(newSize);
    setCurrentPage(1);
    if (userInfo) {
      fetchRules(1, newSize);
    }
  };

  if (noForwardingPermission) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white dark:from-gray-900 dark:to-gray-800 flex flex-col">
        <TitleBar
          user={{
            name: userInfo?.email?.split('@')[0] || 'User',
            email: userInfo?.email || '',
            imageUrl: '',
          }}
          navigation={navigation}
          userNavigation={userNavigation}
          showLanguageSwitch={true}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-md mx-auto px-4">
            <div className="rounded-md bg-white dark:bg-gray-900 p-4 ring-1 ring-inset ring-red-300 dark:ring-red-800 border-l-4 border-red-500 dark:border-red-600 shadow flex items-start gap-3">
              <svg className="h-6 w-6 text-red-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-800 dark:text-red-300">{t.forwardingRules.noPermission || '无转发权限'}</h3>
                <div className="mt-1 text-sm text-red-700 dark:text-red-200">
                  {t.forwardingRules.noPermissionDesc || '您的账户没有端口转发权限，请联系管理员或购买相应套餐。'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white dark:from-gray-900 dark:to-gray-800">
        <TitleBar
          user={{
            name: 'User',
            email: 'user@example.com',
            imageUrl: '',
          }}
          navigation={navigation}
          userNavigation={userNavigation}
          showLanguageSwitch={true}
        />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white dark:from-gray-900 dark:to-gray-800">
        <TitleBar
          user={{
            name: 'User',
            email: 'user@example.com',
            imageUrl: '',
          }}
          navigation={navigation}
          userNavigation={userNavigation}
          showLanguageSwitch={true}
        />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="text-red-600 dark:text-red-400 text-lg font-medium">{error}</div>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans bg-gradient-to-br from-indigo-50 to-white dark:from-gray-900 dark:to-gray-800">
      <TitleBar
        user={{
          name: 'User',
          email: 'user@example.com',
          imageUrl: '',
        }}
        navigation={navigation}
        userNavigation={userNavigation}
        showLanguageSwitch={true}
      />

      {/* Copy Toast */}
      {showCopyToast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div className="bg-gradient-to-r from-green-100 to-green-50 dark:from-green-900 dark:to-gray-900 text-green-800 dark:text-green-200 px-6 py-3 rounded-2xl shadow-2xl flex items-center space-x-2 ring-1 ring-green-200/50 dark:ring-green-900/50 backdrop-blur">
            <CheckIcon className="h-5 w-5" />
            <span>{t.forwardingRules.copySuccess}</span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-8 sm:px-0">
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h1 className="text-3xl font-bold font-sans text-gray-900 dark:text-white tracking-tight">
                {t.forwardingRules.title}
              </h1>
              <p className="mt-3 text-base font-sans text-gray-700 dark:text-gray-300">
                {t.forwardingRules.description}
              </p>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
              <button
                type="button"
                onClick={() => {
                  setEditingRule(null);
                  setIsModalOpen(true);
                }}
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 px-5 py-2 text-base font-semibold text-white shadow-lg hover:scale-105 active:scale-95 transition focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 sm:w-auto"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                {t.forwardingRules.addRule}
              </button>
            </div>
          </div>

          {/* 桌面端表格 */}
          <div className="mt-8 flex flex-col">
            <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                <div className="overflow-hidden shadow-xl ring-1 ring-indigo-100/50 dark:ring-gray-800/50 md:rounded-xl backdrop-blur">
                  <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700 hidden md:table">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th
                          scope="col"
                          className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6"
                        >
                          {t.forwardingRules.name}
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                        >
                          {t.forwardingRules.deviceGroup}
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                        >
                          {t.forwardingRules.listenPort}
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                        >
                          {t.forwardingRules.destination}
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                        >
                          {t.forwardingRules.status}
                        </th>
                        <th
                          scope="col"
                          className="relative py-3.5 pl-3 pr-4 sm:pr-6"
                        >
                          <span className="sr-only">{t.forwardingRules.actions}</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900 font-sans">
                      {rules.map((rule) => {
                        const config = JSON.parse(rule.config);
                        const deviceGroup = getDeviceGroupInfo(rule.device_group_in);
                        return (
                          <tr key={rule.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-6">
                              <div className="flex items-center">
                                <span className="truncate max-w-[200px] font-sans">{rule.name}</span>
                              </div>
                            </td>
                            <td className="px-3 py-4 text-sm text-gray-500 dark:text-gray-300">
                              <div className="space-y-1 font-sans">
                                <div className="font-medium font-sans text-gray-900 dark:text-white">{deviceGroup.name}</div>
                                {deviceGroup.connectHost && (
                                  <div className="flex items-center space-x-2 text-xs text-gray-400 dark:text-gray-500">
                                    <span>
                                      {deviceGroup.connectHost}:{rule.listen_port}
                                    </span>
                                    <button
                                      onClick={() => handleCopy(`${deviceGroup.connectHost}:${rule.listen_port}`)}
                                      className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
                                      title={t.forwardingRules.copy}
                                    >
                                      <ClipboardIcon className="h-4 w-4" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-300">
                              <div className="space-y-1 font-sans">
                                <div>{rule.listen_port || t.forwardingRules.randomPort}</div>
                                {deviceGroup.portRange && (
                                  <div className="text-xs font-sans text-gray-400 dark:text-gray-500">
                                    {t.forwardingRules.portRange}: {deviceGroup.portRange}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-4 text-sm text-gray-500 dark:text-gray-300">
                              <div className="space-y-1 font-sans">
                                {config.dest?.map((dest: string, index: number) => (
                                  <div key={index} className="truncate max-w-[200px] font-sans">{dest}</div>
                                ))}
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm">
                              <span
                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium font-sans ${
                                  rule.status === 'ForwardRuleStatus_Normal'
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                    : rule.status === 'ForwardRuleStatus_Error'
                                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                                }`}
                              >
                                {rule.status.replace('ForwardRuleStatus_', '')}
                              </span>
                            </td>
                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                              <div className="flex items-center justify-end space-x-2 font-sans">
                                <button
                                  onClick={() => handleDiagnose(rule.id)}
                                  className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                  title={t.forwardingRules.diagnose}
                                >
                                  <WrenchIcon className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingRule(null);
                                    setIsModalOpen(true);
                                    setInitialData({
                                      source: rule.name,
                                      destination: config.dest?.join('\n'),
                                      device_group_in: rule.device_group_in,
                                      listen_port: rule.listen_port
                                    });
                                  }}
                                  className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                  title={t.forwardingRules.copy}
                                >
                                  {t.forwardingRules.copy}
                                </button>
                                <button
                                  onClick={() => openEditModal(rule)}
                                  className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                  title={t.forwardingRules.edit}
                                >
                                  {t.forwardingRules.edit}
                                </button>
                                <button
                                  onClick={() => handleDeleteRule(rule.id)}
                                  className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                  title={t.forwardingRules.delete}
                                >
                                  {t.forwardingRules.delete}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {/* 移动端卡片列表 */}
                  <div className="md:hidden flex flex-col gap-4 p-2">
                    {rules.map((rule) => {
                      const config = JSON.parse(rule.config);
                      const deviceGroup = getDeviceGroupInfo(rule.device_group_in);
                      return (
                        <div
                          key={rule.id}
                          className="rounded-2xl border border-indigo-100 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 p-5 shadow-lg ring-1 ring-indigo-100/30 dark:ring-gray-800/30 mb-2"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-base font-sans text-gray-900 dark:text-white truncate max-w-[60%]">{rule.name}</span>
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium font-sans ${
                              rule.status === 'ForwardRuleStatus_Normal'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                : rule.status === 'ForwardRuleStatus_Error'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                            }`}>
                              {rule.status.replace('ForwardRuleStatus_', '')}
                            </span>
                          </div>
                          <div className="mb-1 text-sm font-sans">
                            <span className="font-semibold font-sans text-gray-700 dark:text-gray-200">{t.forwardingRules.deviceGroup}:</span>
                            <span className="ml-1 font-sans text-gray-900 dark:text-white">{deviceGroup.name}</span>
                          </div>
                          {deviceGroup.connectHost && (
                            <div className="flex items-center space-x-2 text-xs text-gray-400 dark:text-gray-500 mb-1">
                              <span>
                                {deviceGroup.connectHost}:{rule.listen_port}
                              </span>
                              <button
                                onClick={() => handleCopy(`${deviceGroup.connectHost}:${rule.listen_port}`)}
                                className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
                                title={t.forwardingRules.copy}
                              >
                                <ClipboardIcon className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                          <div className="mb-1 text-sm font-sans">
                            <span className="font-semibold font-sans text-gray-700 dark:text-gray-200">{t.forwardingRules.listenPort}:</span>
                            <span className="ml-1 font-sans text-gray-900 dark:text-white">{rule.listen_port || t.forwardingRules.randomPort}</span>
                          </div>
                          <div className="mb-1 text-sm font-sans">
                            <span className="font-semibold font-sans text-gray-700 dark:text-gray-200">{t.forwardingRules.destination}:</span>
                            <div className="ml-1 font-sans text-gray-900 dark:text-white break-words whitespace-pre-line">
                              {config.dest?.join('\n')}
                            </div>
                          </div>
                          <div className="flex justify-between items-center mt-4 gap-2 font-sans">
                            <button
                              onClick={() => handleDiagnose(rule.id)}
                              className="flex-1 flex items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 py-2 text-sm font-medium hover:bg-indigo-100 dark:hover:bg-indigo-800 transition"
                              title={t.forwardingRules.diagnose}
                            >
                              <WrenchIcon className="h-5 w-5 mr-1" />
                              {t.forwardingRules.diagnose}
                            </button>
                            <button
                              onClick={() => {
                                setEditingRule(null);
                                setIsModalOpen(true);
                                setInitialData({
                                  source: rule.name,
                                  destination: config.dest?.join('\n'),
                                  device_group_in: rule.device_group_in,
                                  listen_port: rule.listen_port
                                });
                              }}
                              className="flex-1 flex items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300 py-2 text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-800 transition"
                              title={t.forwardingRules.copy}
                            >
                              {t.forwardingRules.copy}
                            </button>
                            <button
                              onClick={() => openEditModal(rule)}
                              className="flex-1 flex items-center justify-center rounded-lg bg-yellow-50 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 py-2 text-sm font-medium hover:bg-yellow-100 dark:hover:bg-yellow-800 transition"
                              title={t.forwardingRules.edit}
                            >
                              {t.forwardingRules.edit}
                            </button>
                            <button
                              onClick={() => handleDeleteRule(rule.id)}
                              className="flex-1 flex items-center justify-center rounded-lg bg-red-50 dark:bg-red-900 text-red-600 dark:text-red-300 py-2 text-sm font-medium hover:bg-red-100 dark:hover:bg-red-800 transition"
                              title={t.forwardingRules.delete}
                            >
                              {t.forwardingRules.delete}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Page size selector, total count, and Pagination - improved layout */}
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 px-4 py-3 rounded-b-xl gap-2 shadow ring-1 ring-indigo-100/30 dark:ring-gray-800/30 backdrop-blur mt-4">
            <div className="flex flex-1 items-center gap-4 w-full sm:w-auto font-sans">
              <div className="flex items-center space-x-2">
                <label htmlFor="page-size" className="text-sm font-sans text-gray-700 dark:text-gray-300">每页显示</label>
                <select
                  id="page-size"
                  value={pageSize}
                  onChange={handlePageSizeChange}
                  className="h-9 block w-auto rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  {[10, 20, 50, 100].map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
                <span className="text-sm font-sans text-gray-700 dark:text-gray-300">条</span>
              </div>
              <span className="text-sm font-sans text-gray-700 dark:text-gray-300">
                共 <span className="font-semibold font-sans">{total}</span> 条规则
              </span>
              <span className="text-sm font-sans text-gray-700 dark:text-gray-300">
                已用规则数: <span className="font-semibold font-sans">{total}</span>
                {forwardUser?.max_rules ? ` / ${forwardUser.max_rules}` : ''}
              </span>
              {forwardUser?.max_rules && (
                <span className="text-sm font-sans text-gray-700 dark:text-gray-300">
                  剩余规则数: <span className="font-semibold font-sans">{forwardUser.max_rules - total}</span>
                </span>
              )}
            </div>
            {/* 桌面端分页 */}
            <div className="hidden md:inline-flex">
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
            </div>
            {/* 移动端分页 */}
            <div className="flex md:hidden w-full overflow-x-auto gap-1 py-1">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="min-w-[40px] h-10 flex items-center justify-center rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Previous"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              {/* 只显示前一页、当前页、后一页和省略号 */}
              {currentPage > 2 && (
                <>
                  <button
                    onClick={() => handlePageChange(1)}
                    className="min-w-[40px] h-10 flex items-center justify-center rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold"
                  >1</button>
                  {currentPage > 3 && <span className="min-w-[24px] h-10 flex items-center justify-center text-gray-400">…</span>}
                </>
              )}
              {currentPage > 1 && (
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  className="min-w-[40px] h-10 flex items-center justify-center rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold"
                >{currentPage - 1}</button>
              )}
              <button
                className="min-w-[40px] h-10 flex items-center justify-center rounded bg-indigo-600 text-white font-semibold"
                aria-current="page"
              >{currentPage}</button>
              {currentPage < totalPages && (
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  className="min-w-[40px] h-10 flex items-center justify-center rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold"
                >{currentPage + 1}</button>
              )}
              {currentPage < totalPages - 1 && (
                <>
                  {currentPage < totalPages - 2 && <span className="min-w-[24px] h-10 flex items-center justify-center text-gray-400">…</span>}
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    className="min-w-[40px] h-10 flex items-center justify-center rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold"
                  >{totalPages}</button>
                </>
              )}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="min-w-[40px] h-10 flex items-center justify-center rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Next"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Diagnosis Modal */}
      {diagnosisModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div
            className="relative transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 px-6 pt-7 pb-6 text-left shadow-2xl transition-all w-full max-w-full sm:max-w-lg pointer-events-auto ring-1 ring-indigo-100/50 dark:ring-gray-800/50 backdrop-blur">
            <div>
              <div className="mt-3 text-center sm:mt-5">
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                  {t.forwardingRules.diagnosisResult}
                </h3>
                <div className="mt-4">
                  {diagnosisLoading ? (
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                  ) : (
                    <pre className="mt-2 whitespace-pre-wrap text-sm text-left font-mono text-gray-500 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 p-4 rounded-md">
                      {diagnosisResult}
                    </pre>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-5 sm:mt-6">
              <button
                type="button"
                className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:text-sm"
                onClick={() => setDiagnosisModalOpen(false)}
              >
                {t.forwardingRules.close}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div
            className="relative transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 px-6 pt-7 pb-6 text-left shadow-2xl transition-all w-full max-w-full sm:max-w-lg pointer-events-auto ring-1 ring-indigo-100/50 dark:ring-gray-800/50 backdrop-blur">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900 sm:mx-0 sm:h-10 sm:w-10">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-300" aria-hidden="true" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white" id="modal-title">
                  {t.forwardingRules.confirmDeleteTitle || '确认删除规则？'}
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500 dark:text-gray-300">
                    {t.forwardingRules.confirmDeleteText || '确定要删除该规则吗？此操作不可撤销。'}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                className="inline-flex w-full justify-center rounded-md bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={confirmDeleteRule}
                disabled={deleteLoading}
              >
                {deleteLoading ? (t.forwardingRules.delete + '...') : t.forwardingRules.delete}
              </button>
              <button
                type="button"
                className="mt-3 inline-flex w-full justify-center rounded-md bg-white dark:bg-gray-800 px-4 py-2 text-base font-medium text-gray-700 dark:text-gray-200 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteLoading}
              >
                {t.common.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      <RuleModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRule(null);
          setInitialData(undefined);
        }}
        onSubmit={editingRule ? handleEditRule : handleAddRule}
        initialData={initialData}
        deviceGroups={deviceGroups}
        isCopyMode={!editingRule && !!initialData}
      />
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

// Pagination component styled like Tailwind UI Card footer with page buttons
function Pagination({ currentPage, totalPages, onPageChange }: { currentPage: number, totalPages: number, onPageChange: (page: number) => void }) {
  if (totalPages <= 1) return null;

  const getPages = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm font-sans" aria-label="Pagination">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 dark:text-gray-500 ring-1 ring-inset ring-gray-300 dark:ring-gray-700 bg-white dark:bg-gray-900 hover:bg-indigo-50 dark:hover:bg-indigo-800 focus:z-20 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Previous"
      >
        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none">
          <path d="M12.75 15.25L8.25 10.75L12.75 6.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {getPages().map((page, idx) =>
        typeof page === 'number' ? (
          <button
            key={`page-${page}`}
            onClick={() => onPageChange(page)}
            aria-current={page === currentPage ? 'page' : undefined}
            className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:z-20 focus:outline-none transition-colors
              ${page === currentPage
                ? 'z-10 bg-indigo-600 text-white'
                : 'text-gray-900 dark:text-gray-200 bg-white dark:bg-gray-900 hover:bg-indigo-50 dark:hover:bg-indigo-800'}`}
          >
            {page}
          </button>
        ) : (
          <span
            key={`ellipsis-${idx}`}
            className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-400 dark:text-gray-500 ring-1 ring-inset ring-gray-300 dark:ring-gray-700 bg-white dark:bg-gray-900"
          >…</span>
        )
      )}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 dark:text-gray-500 ring-1 ring-inset ring-gray-300 dark:ring-gray-700 bg-white dark:bg-gray-900 hover:bg-indigo-50 dark:hover:bg-indigo-800 focus:z-20 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Next"
      >
        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none">
          <path d="M7.25 15.25L11.75 10.75L7.25 6.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </nav>
  );
} 