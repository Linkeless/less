export const processTrafficData = (data: any[]): any[] => {
  const dailyData = new Map<number, { download: number; upload: number }>();
  
  data.forEach(item => {
    const day = item.record_at || item.created_at;
    const current = dailyData.get(day) || { download: 0, upload: 0 };
    
    const rate = item.server_rate || 1;
    dailyData.set(day, {
      download: current.download + (item.d * rate) / (1024 * 1024 * 1024),
      upload: current.upload + (item.u * rate) / (1024 * 1024 * 1024)
    });
  });

  return Array.from(dailyData.entries())
    .map(([timestamp, traffic]) => ({
      date: new Date(timestamp * 1000).toLocaleDateString(),
      download: Number(traffic.download.toFixed(2)),
      upload: Number(traffic.upload.toFixed(2))
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

export const formatBytes = (bytes: number): string => {
  const units = ['MB', 'GB', 'TB', 'PB'];
  let value = bytes / (1024 * 1024 * 1024); // Convert to GB first
  let unitIndex = 1; // Start at GB (index 1)

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  if (unitIndex === 0) { // MB
    return `${Math.round(value)}${units[unitIndex]}`;
  }
  return `${value.toFixed(1)}${units[unitIndex]}`;
};
