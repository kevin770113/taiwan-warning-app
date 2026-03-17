// 檔案：lib/crawlers/diplomacy.ts

export async function fetchDiplomacyData() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 秒連線防禦

    // 抓取外交部領事事務局：國外旅遊警示分級表 Open Data (JSON 格式)
    const url = "https://www.boca.gov.tw/sp-trv-open-data-1.html";
    
    const res = await fetch(url, { 
      signal: controller.signal, 
      next: { revalidate: 3600 } // Vercel 快取 1 小時
    });
    
    if (!res.ok) throw new Error(`HTTP Error: ${res.status} (外交部 Open Data 抓取失敗)`);
    
    const rawData = await res.json();
    clearTimeout(timeoutId);

    if (!Array.isArray(rawData)) {
      throw new Error("外交部 API 資料結構改變，無法解析非陣列格式");
    }

    // 🚨 真實過濾邏輯：我們只提取「紅色警示 (Red)」或「橙色警示 (Orange)」或「黃色警示 (Yellow)」的國家
    const criticalWarnings = rawData.filter((item: any) => {
      // 由於 Open Data 欄位名稱可能變動，採用防禦性讀取
      const severity = item.severity || item.alertLevel || item.info || "";
      return severity.includes("紅色") || severity.includes("橙色") || severity.includes("黃色");
    });

    // 🚨 真實排序邏輯：危險度高的排前面 (紅 > 橙 > 黃)
    criticalWarnings.sort((a: any, b: any) => {
       const sA = a.severity || a.alertLevel || "";
       const sB = b.severity || b.alertLevel || "";
       const weightA = sA.includes("紅") ? 3 : (sA.includes("橙") ? 2 : 1);
       const weightB = sB.includes("紅") ? 3 : (sB.includes("橙") ? 2 : 1);
       return weightB - weightA;
    });

    // 如果全球太平，無任何重大警示，誠實回報
    if (criticalWarnings.length === 0) {
      return [{
        id: 1, 
        country: "全球", 
        flag: "🌍", 
        status: "無重大紅色旅遊警示", 
        level: "normal", 
        time: new Date().toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" })
      }];
    }

    // 將最危險的前 4 筆真實資料轉換為 UI 格式
    return criticalWarnings.slice(0, 4).map((item: any, index: number) => {
      const severity = item.severity || item.alertLevel || "未知警示";
      let uiLevel = "normal";
      if (severity.includes("紅色") || severity.includes("橙色")) uiLevel = "warning";
      else if (severity.includes("黃色")) uiLevel = "notice";
      
      return {
        id: index + 1,
        country: item.country || item.countryName || "未知國家",
        flag: "⚠️", // 放棄假國旗，改用真實的警告圖示
        status: severity,
        level: uiLevel,
        time: "今日更新" 
      };
    });

  } catch (error) {
    console.error("❌ 外交爬蟲發生錯誤:", error);
    // 🛡️ 誠實的錯誤回報 (絕不給假資料！)
    return [{
       id: 1, 
       country: "連線異常", 
       flag: "📡", 
       status: "無法取得外交部資料", 
       level: "normal", 
       time: "--"
    }];
  }
}
