'use client';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import type { TrafficLog } from '@/lib/types';
import type { TranslationValues } from '@/lib/i18n/context';
import { processTrafficData } from '@/lib/api'; // For processTrafficData

interface TrafficStatsCardProps {
  trafficLog: TrafficLog[];
  loadingTraffic: boolean;
  isMobile: boolean;
  t: TranslationValues;
}

// Helper function moved inside or can be imported if used elsewhere
const formatTraffic = (value: number) => {
  if (value >= 1024 * 1024) {
    return `${(value / (1024 * 1024)).toFixed(1)}PB`;
  }
  if (value >= 1024) {
    return `${(value / 1024).toFixed(1)}TB`;
  }
  if (value < 1) {
    return `${(value * 1024).toFixed(0)}MB`;
  }
  return `${value.toFixed(1)}GB`;
};

export default function TrafficStatsCard({
  trafficLog,
  loadingTraffic,
  isMobile,
  t,
}: TrafficStatsCardProps) {

  const getFilteredTrafficData = () => {
    // processTrafficData is assumed to be available (e.g. imported or passed as prop)
    const data = processTrafficData(trafficLog);
    if (isMobile) {
      return data.slice(-7); // 只显示最后7天的数据
    }
    return data;
  };

  if (loadingTraffic) {
    return (
      <div className="lg:col-span-2 space-y-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 leading-7">{t.dashboard.trafficStats}</h3>
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
        </div>
      </div>
    );
  }

  if (trafficLog.length === 0) {
    return (
      <div className="lg:col-span-2 space-y-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 leading-7">{t.dashboard.trafficStats}</h3>
        <div className="text-center py-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">No traffic data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:col-span-2 space-y-6">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 leading-7">{t.dashboard.trafficStats}</h3>
      <div>
        <div className="h-[400px] md:h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={getFilteredTrafficData()} // Uses the internal function
              margin={isMobile ? 
                { top: 10, right: 5, left: 5, bottom: 5 } :
                { top: 10, right: 5, left: 35, bottom: 5 }
              }
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#E5E7EB" 
                vertical={false}
              />
              <XAxis 
                dataKey="date" 
                stroke="#6B7280"
                fontSize={isMobile ? 10 : 12}
                tickLine={false}
                axisLine={{ stroke: '#E5E7EB' }}
                dy={10}
                tick={{ transform: 'translate(0, 6)', fill: '#6B7280' }}
              />
              <YAxis 
                stroke="#6B7280"
                fontSize={isMobile ? 10 : 12}
                tickLine={false}
                axisLine={{ stroke: '#E5E7EB' }}
                tickFormatter={formatTraffic} // Uses the internal function
                width={isMobile ? 50 : 60}
                dx={-4}
                allowDecimals={false}
                tick={{ transform: 'translate(-3, 0)', fill: '#6B7280' }}
              />
              <Tooltip
                cursor={{ fill: '#E5E7EB', opacity: 0.1 }}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: 'none',
                  borderRadius: '0.75rem',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  padding: '0.75rem 1rem',
                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                  color: '#111827'
                }}
                formatter={(value: number, name: string) => [
                  formatTraffic(value), // Uses the internal function
                  name === 'download' ? 'Download' : 'Upload'
                ]}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Bar
                dataKey="download"
                fill="#6366F1"
                radius={[4, 4, 0, 0]}
                maxBarSize={isMobile ? 40 : 60}
              />
              <Bar
                dataKey="upload"
                fill="#34D399"
                radius={[4, 4, 0, 0]}
                maxBarSize={isMobile ? 40 : 60}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
} 