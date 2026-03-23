// 檔案：lib/useIntelligence.ts
import { useState, useEffect, useCallback } from 'react';

export function useIntelligence() {
  const [data, setData] = useState<any>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("--:--");

  const fetchData = useCallback(async () => {
    setIsFetching(true);
    try {
      // 🚨 PWA 終極破甲：加入毫秒級時間戳，徹底摧毀 Service Worker 快取防禦
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/intelligence?t=${timestamp}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) throw new Error('Network response was not ok');
      const result = await response.json();
      setData(result);
      setLastUpdated(new Date().toLocaleTimeString("zh-TW", { timeZone: 'Asia/Taipei', hour: "2-digit", minute: "2-digit" }));
    } catch (error) {
      console.error("Failed to fetch intelligence:", error);
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000); // 每 5 分鐘背景更新
    return () => clearInterval(interval);
  }, [fetchData]);

  return { data, lastUpdated, isFetching, refetch: fetchData };
}
