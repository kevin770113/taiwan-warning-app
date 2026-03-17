// 檔案：lib/useIntelligence.ts
"use client";

import { useState, useEffect, useCallback } from "react";

export interface IntelligenceData {
  military: any[];
  diplomacy: any[];
  finance: any[];
  news: any[];
}

const CACHE_KEY = "taiwan_warning_intelligence_cache";
const CACHE_DURATION = 10 * 60 * 1000; // 10 分鐘快取

export function useIntelligence() {
  const [data, setData] = useState<IntelligenceData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("尚未更新");
  const [isFetching, setIsFetching] = useState<boolean>(true);

  const fetchIntelligence = useCallback(async (forceRefresh = false) => {
    setIsFetching(true);
    try {
      // 1. 檢查本地快取 (LocalStorage)
      const cachedString = localStorage.getItem(CACHE_KEY);
      if (cachedString && !forceRefresh) {
        const cached = JSON.parse(cachedString);
        const now = Date.now();
        if (now - cached.timestamp < CACHE_DURATION) {
          setData(cached.data);
          setLastUpdated(new Date(cached.timestamp).toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" }));
          setIsFetching(false);
          return; // 命中快取，不浪費網路流量！
        }
      }

      // 2. 呼叫我們剛剛寫的後端 BFF 路由！
      const res = await fetch('/api/intelligence');
      if (!res.ok) throw new Error("後端 API 發生錯誤");
      
      const newData: IntelligenceData = await res.json();
      const nowTs = Date.now();
      
      // 3. 寫入新的快取
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        timestamp: nowTs,
        data: newData
      }));

      setData(newData);
      setLastUpdated(new Date(nowTs).toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" }));

    } catch (error) {
      console.error("情報獲取失敗:", error);
      // 如果網路斷線，盡量拿舊快取來墊檔
      const cachedString = localStorage.getItem(CACHE_KEY);
      if (cachedString) {
        setData(JSON.parse(cachedString).data);
      }
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchIntelligence();
  }, [fetchIntelligence]);

  return { data, lastUpdated, isFetching, refetch: () => fetchIntelligence(true) };
}
