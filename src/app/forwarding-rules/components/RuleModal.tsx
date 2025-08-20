'use client';

import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '@/lib/i18n/hooks';

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
  allowed_out?: string;
  allowed_in?: string;
  display_protocol?: string;
}

interface RuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rule: { source: string; destination: string; device_group_in: number; device_group_out?: number; listen_port?: number }) => void;
  initialData?: { source: string; destination: string; device_group_in?: number; device_group_out?: number; listen_port?: number };
  deviceGroups: DeviceGroup[];
  isCopyMode?: boolean;
}

export default function RuleModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  deviceGroups,
  isCopyMode = false,
}: RuleModalProps) {
  const { t } = useLanguage();

  // 获取入口设备组（type 包含 Inbound）
  const inboundGroups = deviceGroups.filter(group => 
    group.type === 'DeviceGroupType_Inbound' && group.display_num && group.display_num > 0
  );

  // State for selected device groups
  const [selectedGroupId, setSelectedGroupId] = useState<number>(
    initialData?.device_group_in || inboundGroups[0]?.id || deviceGroups[0]?.id
  );
  const [selectedOutGroupId, setSelectedOutGroupId] = useState<number | undefined>(
    initialData?.device_group_out
  );
  const selectedGroup = deviceGroups.find(g => g.id === Number(selectedGroupId));
  let portMin = 1, portMax = 65535;
  if (selectedGroup?.port_range) {
    const [minStr, maxStr] = selectedGroup.port_range.split('-');
    portMin = Number(minStr) || 1;
    portMax = Number(maxStr) || 65535;
  }

  // 获取可用的出口设备组
  const getAvailableOutboundGroups = () => {
    if (!selectedGroup?.allowed_out) {
      // 如果没有指定 allowed_out，返回空数组（直连模式）
      return [];
    }
    // 解析 allowed_out 字段（可能是逗号分隔的ID列表）
    const allowedIds = selectedGroup.allowed_out.split(',').map(id => Number(id.trim()));
    return deviceGroups.filter(group => 
      allowedIds.includes(group.id) && group.display_num && group.display_num > 0
    );
  };

  const availableOutboundGroups = getAvailableOutboundGroups();
  const needsOutbound = selectedGroup?.allowed_out ? true : false;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const destination = formData.get('destination') as string;
    
    // 校验每一行格式（IPv4:port、[IPv6]:port、域名:port）
    const addresses = destination.split('\n').filter(line => line.trim());
    console.log('目标地址分割结果:', addresses);
    const invalidLines = addresses.filter(addr =>
      !/^((?:(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)|\[[0-9a-fA-F:]+\]|([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}):\d{1,5}$/.test(addr.trim())
    );
    console.log('格式有误的行:', invalidLines);
    if (invalidLines.length > 0) {
      alert('此地址格式有误: ' + invalidLines.join(', ') + '\n每行应为 1.2.3.4:5678、[2001::]:5678 或 example.com:5678');
      return;
    }

    const rule: {
      source: string;
      destination: string;
      device_group_in: number;
      device_group_out?: number;
      listen_port?: number;
    } = {
      source: formData.get('source') as string,
      destination: destination,
      device_group_in: Number(formData.get('device_group_in')),
    };
    const deviceGroupOutRaw = formData.get('device_group_out');
    if (deviceGroupOutRaw && deviceGroupOutRaw !== '') {
      rule.device_group_out = Number(deviceGroupOutRaw);
    }
    const listenPortRaw = formData.get('listen_port');
    if (listenPortRaw) {
      rule.listen_port = Number(listenPortRaw);
    }
    onSubmit(rule);
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
          leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 dark:bg-black/60 transition-opacity" />
        </Transition.Child>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 overflow-y-auto">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
            leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white/90 dark:bg-gray-900/90 p-8 shadow-2xl ring-1 ring-indigo-100/50 dark:ring-gray-800/50 backdrop-blur transition-all font-sans">
              <div className="mb-6">
                <Dialog.Title
                  as="h3"
                  className="text-2xl font-bold font-sans leading-7 text-gray-900 dark:text-white mb-2"
                >
                  {isCopyMode ? t.forwardingRules.copy : initialData ? t.forwardingRules.edit : t.forwardingRules.addRule}
                </Dialog.Title>
                <div className="h-1 w-12 bg-gradient-to-r from-indigo-400 to-blue-400 rounded-full mb-2" />
                <p className="text-sm font-sans text-gray-500 dark:text-gray-400">
                  {t.forwardingRules.destinationHelp}
                </p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6 font-sans">
                <div>
                  <label
                    htmlFor="source"
                    className="block text-sm font-semibold font-sans text-gray-900 dark:text-white mb-1"
                  >
                    {t.forwardingRules.name}
                  </label>
                  <input
                    type="text"
                    name="source"
                    id="source"
                    defaultValue={initialData?.source}
                    className="block w-full rounded-xl border-0 px-3 py-2 font-sans text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-400/70 sm:text-sm dark:bg-gray-800/80 bg-white/80"
                    placeholder={t.forwardingRules.name}
                    title={t.forwardingRules.name}
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="destination"
                    className="block text-sm font-semibold font-sans text-gray-900 dark:text-white mb-1"
                  >
                    {t.forwardingRules.destination}
                  </label>
                  <textarea
                    name="destination"
                    id="destination"
                    defaultValue={initialData?.destination}
                    rows={4}
                    className="block w-full rounded-xl border-0 px-3 py-2 font-sans text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-400/70 sm:text-sm dark:bg-gray-800/80 bg-white/80"
                    placeholder={'1.2.3.4:8888\n[2001::]:8888'}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="device_group_in" className="block text-sm font-semibold font-sans text-gray-900 dark:text-white mb-1">
                      入口
                    </label>
                    <select
                      name="device_group_in"
                      id="device_group_in"
                      value={selectedGroupId}
                      className="block w-full rounded-xl border-0 px-3 py-2 font-sans text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-indigo-400/70 sm:text-sm dark:bg-gray-800/80 bg-white/80"
                      required
                      onChange={e => {
                        setSelectedGroupId(Number(e.target.value));
                        // 当入口改变时，清空出口选择
                        setSelectedOutGroupId(undefined);
                      }}
                    >
                      {inboundGroups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {needsOutbound ? (
                    <div>
                      <label htmlFor="device_group_out" className="block text-sm font-semibold font-sans text-gray-900 dark:text-white mb-1">
                        出口
                      </label>
                      <select
                        name="device_group_out"
                        id="device_group_out"
                        className="block w-full rounded-xl border-0 px-3 py-2 font-sans text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-indigo-400/70 sm:text-sm dark:bg-gray-800/80 bg-white/80"
                        onChange={e => setSelectedOutGroupId(e.target.value ? Number(e.target.value) : undefined)}
                        value={selectedOutGroupId || (availableOutboundGroups[0]?.id || '')}
                        required
                      >
                        {availableOutboundGroups.map((group) => (
                          <option key={group.id} value={group.id}>
                            {group.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-semibold font-sans text-gray-900 dark:text-white mb-1">
                        出口
                      </label>
                      <div className="block w-full rounded-xl border-0 px-3 py-2 font-sans text-gray-500 dark:text-gray-400 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 sm:text-sm dark:bg-gray-800/80 bg-white/80">
                        入口直出，无需出口
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label htmlFor="listen_port" className="block text-sm font-semibold font-sans text-gray-900 dark:text-white mb-1">
                    {t.forwardingRules.listenPort}
                  </label>
                  <input
                    type="number"
                    name="listen_port"
                    id="listen_port"
                    min={portMin}
                    max={portMax}
                    defaultValue={initialData?.listen_port}
                    className="block w-full rounded-xl border-0 px-3 py-2 font-sans text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-400/70 sm:text-sm dark:bg-gray-800/80 bg-white/80"
                    placeholder={t.forwardingRules.listenPort}
                  />
                  <p className="mt-1 text-xs font-sans text-gray-500 dark:text-gray-400">
                    端口范围: {selectedGroup?.port_range || '未知'}，留空则随机
                  </p>
                </div>
                <div className="mt-8 flex flex-col sm:flex-row sm:justify-end gap-3">
                  <button
                    type="submit"
                    className="inline-flex w-full sm:w-auto justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 px-6 py-2 text-base font-semibold font-sans text-white shadow-lg hover:scale-105 active:scale-95 transition focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2"
                  >
                    {isCopyMode ? t.forwardingRules.copy : initialData ? t.forwardingRules.edit : t.forwardingRules.addRule}
                  </button>
                  <button
                    type="button"
                    className="inline-flex w-full sm:w-auto justify-center rounded-xl bg-white/80 dark:bg-gray-800/80 px-6 py-2 text-base font-semibold font-sans text-gray-900 dark:text-gray-200 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    onClick={onClose}
                  >
                    {t.common.cancel}
                  </button>
                </div>
              </form>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
} 