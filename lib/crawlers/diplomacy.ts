// 檔案：lib/crawlers/diplomacy.ts

// 模擬的回退資料 (當真實 API 掛掉時使用)
const FALLBACK_DIPLOMACY = [
  { id: 1, country: "美國", flag: "🇺🇸", status: "Level 3: Reconsider Travel", level: "warning", time: "2 小時前" },
  { id: 2, country: "日本", flag: "🇯🇵", status: "維持正常", level: "normal", time: "1 天前" },
  { id: 3, country: "英國", flag: "🇬🇧", status: "維持正常", level: "normal", time: "3 天前" },
  { id: 4, country: "澳洲", flag: "🇦🇺", status: "Level 2: High Caution", level: "notice", time: "5 小時前" },
];

export async function fetchDiplomacyData() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 秒防禦

    // 抓取外交部領事事務局：國外旅遊警示分級表 Open Data (JSON 格式)
    const url = "https://www.boca.gov.tw/sp-trv-open-data-1.html";
    
    const res = await fetch(url, { 
      signal: controller.signal, 
      next: { revalidate: 3600 } // 快取 1 小時，旅遊警示不需要秒級更新
    });
    
    if (!res.ok) throw new Error("外交部 Open Data 抓取失敗");
    const data = await res.json();
    clearTimeout(timeoutId);

    // 我們需要把官方的原始資料，轉換成我們 UI 需要的 4 筆重點國家
    // 為了展示目的，我們先抓取資料陣列的前幾筆，並轉譯燈號
    // (實際運作時，這裡可以寫邏輯去篩選特定國家如美、日、英、澳)
    
    const formattedData = data.slice(0, 4).map((item: any, index: number) => {
      // 外交部燈號轉換 (紅/橙/黃/灰)
      let uiLevel = "normal";
      if (item.severity === "紅色警示" || item.severity === "橙色警示") uiLevel = "warning";
      if (item.severity === "黃色警示") uiLevel = "notice";

      // 簡單的國旗 Mapping (這裡只做示範)
      const flagMap: Record<string, string> = { "美國": "🇺🇸", "日本": "🇯🇵", "英國": "🇬🇧", "澳洲": "🇦🇺" };
      
      return {
        id: index + 1,
        country: item.country || "未知國家",
        flag: flagMap[item.country] || "🌐", // 找不到國旗給個地球圖示
        status: item.severity || "維持正常",
        level: uiLevel,
        time: "今日更新" // OpenAPI 沒有提供精準時分秒，統一顯示今日
      };
    });

    // 如果 API 吐不出東西，還是回傳 Fallback
    return formattedData.length > 0 ? formattedData : FALLBACK_DIPLOMACY;

  } catch (error) {
    console.error("❌ 外交爬蟲發生錯誤:", error);
    return FALLBACK_DIPLOMACY;
  }
}
