'use client';
import { useState, useEffect, useMemo } from 'react';
import { ArrowPathIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
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
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell cursor-pointer"
                        onClick={() => handleSort('user_agent')}
                      >
                        客户端
                        <SortIcon field="user_agent" />
                      </th>
                      <th 
                        scope="col" 
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell cursor-pointer"
                        onClick={() => handleSort('host')}
                      >
                        域名
                        <SortIcon field="host" />
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
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {request.ip}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                          <span className="truncate block max-w-[150px]">{request.user_agent}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 hidden md:table-cell">
                          <span className="truncate block max-w-[150px]">
                            {typeof request.host === 'string' 
                              ? request.host 
                              : (request.host && request.host.length > 0 
                                  ? request.host.join(', ') 
                                  : '-')}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {request.datetime}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 