// 檔案：app/api/intelligence/route.ts
import { NextResponse } from 'next/server';
import { fetchFinanceData } from '@/lib/crawlers/finance';

// 🌟 Vercel 邊緣快取魔法：設定每 600 秒 (10 分鐘) 才重新去跑一次爬蟲
// 這能完美保護免費額度，並抵禦瞬間的高流量爆發
export const revalidate = 600;

// --- 佔位區：模擬尚未建立的爬蟲模組 (未來會移到各自的 lib/crawlers/ 檔案中) ---
async function mockFetchMilitary() {
  await new Promise(res => setTimeout(res, 300)); // 模擬延遲
  return [
    { id: 1, date: "今日 14:00", title: "國防部發布即時軍事動態", sorties: 15, crossed: 4, isDrill: false, desc: "偵獲共機 15 架次、共艦 4 艘次持續在臺海周邊活動。其中 4 架次逾越海峽中線及其延伸線。" },
    { id: 2, date: "昨日 09:30", title: "東部海域聯合戰備警巡", sorties: 22, crossed: 10, isDrill: false, desc: "配合共艦執行聯合戰備警巡，國軍運用聯合情監偵手段嚴密掌握。" },
  ];
}

async function mockFetchDiplomacy() {
  await new Promise(res => setTimeout(res, 200));
  return [
    { id: 1, country: "美國", flag: "🇺🇸", status: "Level 3: Reconsider Travel", level: "warning", time: "2 小時前" },
    { id: 2, country: "日本", flag: "🇯🇵", status: "維持正常", level: "normal", time: "1 天前" },
    { id: 3, country: "英國", flag: "🇬🇧", status: "維持正常", level: "normal", time: "3 天前" },
    { id: 4, country: "澳洲", flag: "🇦🇺", status: "Level 2: High Caution", level: "notice", time: "5 小時前" },
  ];
}

async function mockFetchNews() {
  await new Promise(res => setTimeout(res, 400));
  return [
    { id: 1, source: "Reuters", time: "30 分鐘前", title: "U.S. closely monitoring Taiwan Strait activities", snippet: "Washington reiterates calls for peaceful resolution and stability in the region..." },
    { id: 2, source: "國內綜合報導", time: "2 小時前", title: "外資單日大幅賣超台股 300 億，匯市呈現震盪", snippet: "金融圈人士指出，近期地緣政治風險微幅上升，導致避險資金短期流出..." },
  ];
}
// -------------------------------------------------------------------

export async function GET() {
  try {
    // 🌟 容錯機制：使用 Promise.allSettled 併發執行
    // 這樣即使某個網站被擋或掛掉，其他正常抓到的資料依然能回傳！
    const results = await Promise.allSettled([
      mockFetchMilitary(),
      mockFetchDiplomacy(),
      fetchFinanceData(), // 👉 這裡呼叫我們剛剛寫的真實金融爬蟲！
      mockFetchNews(),
    ]);

    // 解析回傳結果，如果該爬蟲狀態是 'fulfilled' 就給資料，如果是 'rejected' (失敗) 就給空陣列
    const militaryData = results[0].status === 'fulfilled' ? results[0].value : [];
    const diplomacyData = results[1].status === 'fulfilled' ? results[1].value : [];
    const financeData = results[2].status === 'fulfilled' ? results[2].value : [];
    const newsData = results[3].status === 'fulfilled' ? results[3].value : [];

    // 組裝成前端 IntelligenceData 預期的 JSON 格式
    const responseData = {
      military: militaryData,
      diplomacy: diplomacyData,
      finance: financeData,
      news: newsData,
    };

    return NextResponse.json(responseData, { status: 200 });

  } catch (error) {
    console.error("情報 API 發生未預期的嚴重錯誤:", error);
    // 🛡️ 最極端的防護網：即使整個 API 崩潰，也要吐出空陣列結構，讓前端 UI 至少不報錯
    return NextResponse.json({ military: [], diplomacy: [], finance: [], news: [] }, { status: 500 });
  }
}
