// 檔案：app/api/intelligence/route.ts
import { NextResponse } from 'next/server';
import { fetchMilitaryData } from '@/lib/crawlers/military';
import { fetchDiplomacyData } from '@/lib/crawlers/diplomacy';
import { fetchFinanceData } from '@/lib/crawlers/finance';
import { fetchNewsData } from '@/lib/crawlers/news';

// 🌟 Vercel 邊緣快取魔法：設定每 600 秒 (10 分鐘) 才重新去跑一次爬蟲
// 這能完美保護免費額度，並抵禦瞬間的高流量爆發
export const revalidate = 600;

export async function GET() {
  try {
    // 🌟 容錯機制：使用 Promise.allSettled 併發執行四大爬蟲
    // 這樣即使某個網站被擋或掛掉，其他正常抓到的資料依然能回傳！
    const results = await Promise.allSettled([
      fetchMilitaryData(),
      fetchDiplomacyData(),
      fetchFinanceData(),
      fetchNewsData(),
    ]);

    // 解析回傳結果，如果該爬蟲狀態是 'fulfilled' 就給真實資料 (或 Fallback)
    // 如果發生不可預期的 'rejected' (失敗)，就給空陣列防雷
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
