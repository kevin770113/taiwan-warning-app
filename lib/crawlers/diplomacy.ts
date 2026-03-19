// 檔案：lib/crawlers/diplomacy.ts

export async function fetchDiplomacyData() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); 

    const url = "https://www.boca.gov.tw/sp-trv-open-data-1.html";
    
    // 🛡️ 零妥協防禦突破：加上完整的瀏覽器 Headers 偽裝，避免被當作無頭爬蟲阻擋
    const res = await fetch(url, { 
      signal: controller.signal, 
      next: { revalidate: 3600 },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
        'Connection': 'keep-alive'
      }
    });
    
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    
    const rawData = await res.json();
    clearTimeout(timeoutId);

    if (!Array.isArray(rawData)) throw new Error("資料結構異常");

    const criticalWarnings = rawData.filter((item: any) => {
      const severity = item.severity || item.alertLevel || item.info || "";
      return severity.includes("紅色") || severity.includes("橙色") || severity.includes("黃色");
    });

    criticalWarnings.sort((a: any, b: any) => {
       const sA = a.severity || a.alertLevel || "";
       const sB = b.severity || b.alertLevel || "";
       const weightA = sA.includes("紅") ? 3 : (sA.includes("橙") ? 2 : 1);
       const weightB = sB.includes("紅") ? 3 : (sB.includes("橙") ? 2 : 1);
       return weightB - weightA;
    });

    if (criticalWarnings.length === 0) {
      return [{ id: 1, country: "全球", flag: "🌍", status: "無重大紅色旅遊警示", level: "normal", time: new Date().toLocaleTimeString("zh-TW", { timeZone: 'Asia/Taipei', hour: "2-digit", minute: "2-digit" }) }];
    }

    return criticalWarnings.slice(0, 4).map((item: any, index: number) => {
      const severity = item.severity || item.alertLevel || "未知警示";
      let uiLevel = "normal";
      if (severity.includes("紅色") || severity.includes("橙色")) uiLevel = "warning";
      else if (severity.includes("黃色")) uiLevel = "notice";
      
      return {
        id: index + 1,
        country: item.country || item.countryName || "未知國家",
        flag: "⚠️",
        status: severity,
        level: uiLevel,
        time: "今日更新" 
      };
    });

  } catch (error) {
    console.error("❌ 外交爬蟲發生錯誤:", error);
    return [{ id: 1, country: "連線異常", flag: "📡", status: "無法取得外交部資料", level: "normal", time: "--" }];
  }
}
