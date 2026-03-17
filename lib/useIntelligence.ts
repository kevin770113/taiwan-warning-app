// 檔案：lib/useIntelligence.ts
"use client";

import { useState, useEffect, useCallback } from "react";

// 定義情報資料的結構
export interface IntelligenceData {
  military: any[];
  diplomacy: any[];
  finance: any[];
  news: any[];
}

const CACHE_KEY = "taiwan_warning_intelligence_cache";
const CACHE_DURATION = 10 * 60 * 1000; // 快取有效時間：10 分鐘 (毫秒)

// 模擬從後端爬蟲抓下來的最新資料 (未來替換成真實 API)
const mockFetchedData: IntelligenceData = {
  military: [
    { id: 1, date: "今日 14:00", title: "國防部發布即時軍事動態", sorties: 15, crossed: 4, isDrill: false, desc: "偵獲共機 15 架次、共艦 4 艘次持續在臺海周邊活動。其中 4 架次逾越海峽中線及其延伸線。" },
    { id: 2, date: "昨日 09:30", title: "東部海域聯合戰備警巡", sorties: 22, crossed: 10, isDrill: false, desc: "配合共艦執行聯合戰備警巡，國軍運用聯合情監偵手段嚴密掌握。" },
  ],
  diplomacy: [
    { id: 1, country: "美國", flag: "🇺🇸", status: "Level 3: Reconsider Travel", level: "warning", time: "2 小時前" },
    { id: 2, country: "日本", flag: "🇯🇵", status: "維持正常", level: "normal", time: "1 天前" },
    { id: 3, country: "英國", flag: "🇬🇧", status: "維持正常", level: "normal", time: "3 天前" },
    { id: 4, country: "澳洲", flag: "🇦🇺", status: "Level 2: High Caution", level: "notice", time: "5 小時前" },
  ],
  finance: [
    { id: 1, name: "台股加權指數 (TAIEX)", value: "20,123.45", change: "-254.12", percent: "-1.25%", isDown: true },
    { id: 2, name: "美元 / 台幣 (USD/TWD)", value: "32.450", change: "+0.120", percent: "+0.37%", isDown: false },
    { id: 3, name: "人民幣 / 台幣 (CNY/TWD)", value: "4.482", change: "+0.015", percent: "+0.33%", isDown: false },
  ],
  news: [
    { id: 1, source: "Reuters", time: "30 分鐘前", title: "U.S. closely monitoring Taiwan Strait activities", snippet: "Washington reiterates calls for peaceful resolution and stability in the region..." },
    { id: 2, source: "國內綜合報導", time: "2 小時前", title: "外資單日大幅賣超台股 300 億，匯市呈現震盪", snippet: "金融圈人士指出，近期地緣政治風險微幅上升，導致避險資金短期流出..." },
    { id: 3, source: "Bloomberg", time: "5 小時前", title: "Supply chain resilience in focus", snippet: "Major semiconductor clients are seeking secondary hubs..." },
  ]
};

export function useIntelligence() {
  const [data, setData] = useState<IntelligenceData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("尚未更新");
  const [isFetching, setIsFetching] = useState<boolean>(true);

  const fetchIntelligence = useCallback(async (forceRefresh = false) => {
    setIsFetching(true);
    try {
      // 1. 檢查 LocalStorage 是否有尚未過期的快取
      const cachedString = localStorage.getItem(CACHE_KEY);
      if (cachedString && !forceRefresh) {
        const cached = JSON.parse(cachedString);
        const now = Date.now();
        if (now - cached.timestamp < CACHE_DURATION) {
          setData(cached.data);
          setLastUpdated(new Date(cached.timestamp).toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" }));
          setIsFetching(false);
          return; // 命中快取，直接返回，不耗費網路流量！
        }
      }

      // 2. 如果沒有快取、已過期，或強制更新 ➔ 執行「模擬網路請求」
      // 這裡故意延遲 1 秒，模擬真實 API 爬蟲的等待時間
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const newData = mockFetchedData; 
      
      const nowTs = Date.now();
      
      // 3. 寫入新的 LocalStorage 快取
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        timestamp: nowTs,
        data: newData
      }));

      setData(newData);
      setLastUpdated(new Date(nowTs).toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" }));

    } catch (error) {
      console.error("情報獲取失敗:", error);
    } finally {
      setIsFetching(false);
    }
  }, []);

  // 元件掛載時，自動檢查並獲取資料
  useEffect(() => {
    fetchIntelligence();
  }, [fetchIntelligence]);

  return { data, lastUpdated, isFetching, refetch: () => fetchIntelligence(true) };
}
