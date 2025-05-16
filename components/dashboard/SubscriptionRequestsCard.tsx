'use client';
import { useState, useEffect, useMemo } from 'react';
import { ArrowPathIcon, ChevronUpIcon, ChevronDownIcon, GlobeAltIcon, DevicePhoneMobileIcon, CalendarIcon, ClockIcon } from '@heroicons/react/24/outline';
import type { RecentSubscriptionRequestsResponse, SubscriptionData, RecentSubscriptionRequest } from '@/lib/types';
import type { TranslationValues } from '@/lib/i18n/context';
import { getRecentSubscriptionRequests } from '@/lib/actions';

interface SubscriptionRequestsCardProps {
  subscription: SubscriptionData | null;
  loading: boolean;
  t: TranslationValues;
}

type SortField = 'datetime' | 'ip' | 'host' | 'user_agent';
type SortDirection = 'asc' | 'desc';

export default function SubscriptionRequestsCard({
  subscription,
  loading,
  t
}: SubscriptionRequestsCardProps) {
  const [requestData, setRequestData] = useState<RecentSubscriptionRequest[]>([]);
  const [totalRequests, setTotalRequests] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('datetime');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const fetchRecentRequests = async () => {
    if (!subscription?.token) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await getRecentSubscriptionRequests(subscription.token);
      console.log('Subscription Request API Response:', response);
      
      // Handle the response according to the actual structure
      if (
        response && 
        typeof response === 'object' && 
        'success' in response && 
        response.success === true && 
        'data' in response && 
        response.data && 
        'recent_requests' in response.data
      ) {
        setRequestData(response.data.recent_requests);
        setTotalRequests(response.data.total_requests || response.data.recent_requests.length);
      } else {
        console.error('Unexpected API response format:', response);
        setError('Invalid response format');
        setRequestData([]);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError((err as Error).message || 'Failed to fetch recent requests');
      setRequestData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (subscription?.token) {
      fetchRecentRequests();
    }
  }, [subscription?.token]);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      // Toggle direction if clicking on the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to descending
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    
    return sortDirection === 'asc' 
      ? <ChevronUpIcon className="h-4 w-4 inline ml-1" /> 
      : <ChevronDownIcon className="h-4 w-4 inline ml-1" />;
  };

  const sortedData = useMemo(() => {
    if (!requestData.length) return [];
    
    return [...requestData].sort((a, b) => {
      let valA: any, valB: any;
      
      switch (sortField) {
        case 'datetime':
          valA = new Date(a.datetime).getTime();
          valB = new Date(b.datetime).getTime();
          break;
        case 'ip':
          valA = a.ip;
          valB = b.ip;
          break;
        case 'host':
          valA = typeof a.host === 'string' ? a.host : (a.host?.join(', ') || '');
          valB = typeof b.host === 'string' ? b.host : (b.host?.join(', ') || '');
          break;
        case 'user_agent':
          valA = a.user_agent;
          valB = b.user_agent;
          break;
        default:
          return 0;
      }
      
      // Default comparison logic
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [requestData, sortField, sortDirection]);

  // Helper function to get country code from IP details
  const getCountryCode = (ipDetails: any): string | undefined => {
    if (!ipDetails) return undefined;
    return ipDetails.country_code || ipDetails.country;
  };

  // Helper function to get location info from IP details
  const getLocationInfo = (ipDetails: any): { city: string | null; region: string | null; org: string | null } => {
    if (!ipDetails) return { city: null, region: null, org: null };
    
    const city = ipDetails.city || null;
    const region = ipDetails.region || null;
    const org = ipDetails.org || ipDetails.organization || ipDetails.asn_organization || null;
    
    return { city, region, org };
  };

  // Helper function to format host data
  const formatHost = (host: string | string[] | undefined): string => {
    if (!host) return '-';
    if (host === 'unknown') return '未知域名';
    if (Array.isArray(host)) {
      return host.length > 0 ? host.join(', ') : '-';
    }
    return host;
  };

  if (loading) {
    return (
      <div className="lg:col-span-2 relative group h-full">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative flex h-full flex-col overflow-hidden rounded-2xl bg-white dark:bg-gray-800">
          <div className="px-8 pt-6 pb-3 sm:px-10 sm:pt-8">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 leading-7 mb-6">订阅拉取记录</h3>
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">加载中...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="lg:col-span-2 relative group h-full">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative flex h-full flex-col overflow-hidden rounded-2xl bg-white dark:bg-gray-800">
          <div className="px-8 pt-6 pb-3 sm:px-10 sm:pt-8">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 leading-7 mb-6">订阅拉取记录</h3>
            <div className="rounded-xl bg-gradient-to-br from-gray-50 dark:from-gray-900 to-white dark:to-gray-800 p-6 text-center shadow-sm ring-1 ring-gray-950/5 dark:ring-white/5">
              <p className="text-sm text-gray-500 dark:text-gray-400">未找到订阅信息</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:col-span-2 relative group h-full">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
      <div className="relative flex h-full flex-col overflow-hidden rounded-2xl bg-white dark:bg-gray-800">
        <div className="px-8 pt-6 pb-3 sm:px-10 sm:pt-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 leading-7">订阅拉取记录</h3>
              {totalRequests > 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">总拉取次数: {totalRequests}</p>
              )}
            </div>
            <button 
              onClick={fetchRecentRequests}
              disabled={isLoading}
              className="inline-flex items-center gap-1 rounded-md bg-white dark:bg-gray-800 px-2.5 py-1.5 text-sm font-medium text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              刷新
            </button>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center flex-grow py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">加载中...</p>
            </div>
          ) : error ? (
            <div className="rounded-xl bg-gradient-to-br from-gray-50 dark:from-gray-900 to-white dark:to-gray-800 p-6 text-center shadow-sm ring-1 ring-gray-950/5 dark:ring-white/5">
              <p className="text-sm text-red-500">{error}</p>
            </div>
          ) : sortedData.length === 0 ? (
            <div className="rounded-xl bg-gradient-to-br from-gray-50 dark:from-gray-900 to-white dark:to-gray-800 p-6 text-center shadow-sm ring-1 ring-gray-950/5 dark:ring-white/5">
              <p className="text-sm text-gray-500 dark:text-gray-400">暂无拉取记录</p>
            </div>
          ) : (
            <div className="rounded-xl bg-gradient-to-br from-gray-50 dark:from-gray-900 to-white dark:to-gray-800 shadow-sm ring-1 ring-gray-950/5 dark:ring-white/5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th 
                        scope="col" 
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('ip')}
                      >
                        IP 地址
                        <SortIcon field="ip" />
                      </th>
                      <th 
                        scope="col" 
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hidden md:table-cell"
                        onClick={() => handleSort('user_agent')}
                      >
                        客户端
                        <SortIcon field="user_agent" />
                      </th>
                      <th 
                        scope="col" 
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hidden md:table-cell"
                        onClick={() => handleSort('host')}
                      >
                        域名
                        <SortIcon field="host" />
                      </th>
                      <th 
                        scope="col" 
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer md:table-cell"
                      >
                        位置
                      </th>
                      <th 
                        scope="col" 
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('datetime')}
                      >
                        时间
                        <SortIcon field="datetime" />
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {sortedData.map((request, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700 hidden md:table-row">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          <div className="flex items-center">
                            {request.ip_details && getCountryCode(request.ip_details) && (
                              <span className="mr-2 inline-block">
                                {getCountryCode(request.ip_details) === 'CN' ? '🇨🇳' : 
                                 getCountryCode(request.ip_details) === 'HK' ? '🇭🇰' : 
                                 getCountryCode(request.ip_details) === 'US' ? '🇺🇸' : 
                                 getCountryCode(request.ip_details) === 'JP' ? '🇯🇵' : 
                                 getCountryCode(request.ip_details) === 'SG' ? '🇸🇬' : 
                                 getCountryCode(request.ip_details) === 'TW' ? '🇨🇳' : 
                                 getCountryCode(request.ip_details) === 'KR' ? '🇰🇷' : 
                                 '🌍'}
                              </span>
                            )}
                            {request.ip}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          <span className="truncate block max-w-[150px]">{request.user_agent}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          <span className="truncate block max-w-[150px]">
                            {formatHost(request.host)}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 md:table-cell">
                          {request.ip_details ? (
                            <div>
                              <div>
                                {(() => {
                                  const { city, region, org } = getLocationInfo(request.ip_details);
                                  return city && region 
                                    ? `${city}, ${region}` 
                                    : city || region || '-';
                                })()}
                              </div>
                              {(() => {
                                const { org } = getLocationInfo(request.ip_details);
                                return org && (
                                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate max-w-[200px]">
                                    {org}
                                  </div>
                                );
                              })()}
                            </div>
                          ) : '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {request.datetime}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {/* 移动端卡片列表 */}
                <div className="md:hidden flex flex-col space-y-3 p-4">
                  {sortedData.map((request, index) => (
                    <div
                      key={index}
                      className="rounded-xl bg-white dark:bg-gray-800 p-4 shadow-sm ring-1 ring-gray-950/5 dark:ring-white/5"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <div className="font-medium text-gray-900 dark:text-gray-100 flex items-center">
                          {request.ip_details && getCountryCode(request.ip_details) && (
                            <span className="mr-2 inline-block">
                              {getCountryCode(request.ip_details) === 'CN' ? '🇨🇳' : 
                               getCountryCode(request.ip_details) === 'HK' ? '🇭🇰' : 
                               getCountryCode(request.ip_details) === 'US' ? '🇺🇸' : 
                               getCountryCode(request.ip_details) === 'JP' ? '🇯🇵' : 
                               getCountryCode(request.ip_details) === 'SG' ? '🇸🇬' : 
                               getCountryCode(request.ip_details) === 'TW' ? '🇨🇳' : 
                               getCountryCode(request.ip_details) === 'KR' ? '🇰🇷' : 
                               '🌍'}
                            </span>
                          )}
                          <span>{request.ip}</span>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 flex flex-col items-end">
                          <div className="flex items-center">
                            <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                            <span>{request.datetime.split(' ')[0]}</span>
                          </div>
                          <div className="flex items-center mt-1">
                            <ClockIcon className="h-3.5 w-3.5 mr-1" />
                            <span>{request.datetime.split(' ')[1]}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        {/* Location info */}
                        {request.ip_details && (
                          <div className="flex items-start mb-2">
                            <GlobeAltIcon className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="text-gray-700 dark:text-gray-300 break-words">
                                {(() => {
                                  const { city, region, org } = getLocationInfo(request.ip_details);
                                  return city && region 
                                    ? `${city}, ${region}` 
                                    : city || region || '-';
                                })()}
                                {(() => {
                                  const { org } = getLocationInfo(request.ip_details);
                                  return org && (
                                    <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">
                                      {org}
                                    </span>
                                  );
                                })()}
                              </span>
                            </div>
                          </div>
                        )}
                        
                        {/* User agent */}
                        <div className="flex items-start">
                          <DevicePhoneMobileIcon className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700 dark:text-gray-300 break-words">{request.user_agent}</span>
                        </div>
                        
                        {/* Host */}
                        <div className="flex items-start">
                          <GlobeAltIcon className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700 dark:text-gray-300 break-words">
                            {formatHost(request.host)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 