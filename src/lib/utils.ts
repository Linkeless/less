'use client'; // Add if any function needs client-side APIs like window or navigator

import md5 from 'md5'; // For getGravatarUrl

// For getFilteredUrl - ensure this env var is available at runtime where this function is called.
// If called only client-side, NEXT_PUBLIC_ is correct.
// If called server-side (e.g. in API routes or RSCs not marked 'use client'), 
// it might need to be accessed differently or passed in.
const BASE_SUB_API_URL = process.env.NEXT_PUBLIC_SUB_API_URL;

export const getGravatarUrl = (email: string): string => {
  const hash = md5(email.trim().toLowerCase());
  return `https://www.gravatar.com/avatar/${hash}?s=256&d=monsterid`;
};

export const getFilteredUrl = (
  token: string, 
  operator: {id: string} | null
): string => {
  const baseUrl = BASE_SUB_API_URL || `${typeof window !== 'undefined' ? window.location.protocol : 'http:'}//${typeof window !== 'undefined' ? window.location.host : 'localhost'}`;
  let url = `${baseUrl}/service/sub?token=${token}`;
  if (operator) {
    url += `&operator=${operator.id}`;
  }
  return url;
};

export const formatDate = (timestamp: string | null): string => {
  if (!timestamp) return 'Never';
  const date = new Date(parseInt(timestamp) * 1000);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).replace(/\//g, '-');
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.error('Failed to copy:', err);
      return false;
    }
  } else {
    // Fallback for environments without navigator.clipboard (e.g. insecure contexts, older browsers)
    // This is a simplified fallback and might not always work.
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed"; // Prevent scrolling to bottom of page in MS Edge.
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.width = "2em";
    textArea.style.height = "2em";
    textArea.style.padding = "0";
    textArea.style.border = "none";
    textArea.style.outline = "none";
    textArea.style.boxShadow = "none";
    textArea.style.background = "transparent";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch (err) {
      console.error('Fallback: Oops, unable to copy', err);
      document.body.removeChild(textArea);
      return false;
    }
  }
};

export const formatExpireDate = (expired_at: string | number | null | undefined): string => {
  if (!expired_at || expired_at === '0' || expired_at === 0) return '永久有效';
  const ts = typeof expired_at === 'string' ? parseInt(expired_at) : expired_at;
  if (isNaN(ts) || ts === 0) return '永久有效';
  return new Date(ts * 1000).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).replace(/\//g, '-');
};

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
