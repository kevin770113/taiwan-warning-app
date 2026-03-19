// 檔案：app/api/intelligence/route.ts
import { NextResponse } from 'next/server';
import { fetchMilitaryData } from '@/lib/crawlers/military';
import { fetchDiplomacyData } from '@/lib/crawlers/diplomacy';
import { fetchFinanceData } from '@/lib/crawlers/finance';
import { fetchNewsData } from '@/lib/crawlers/news';

// 🚨 除錯模式啟動：強制伺服器每次都必須重新執行，絕對不准使用快取！
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const results = await Promise.allSettled([
      fetchMilitaryData(),
      fetchDiplomacyData(),
      fetchFinanceData(),
      fetchNewsData(),
    ]);

    const militaryData = results[0].status === 'fulfilled' ? results[0].value : [];
    const diplomacyData = results[1].status === 'fulfilled' ? results[1].value : [];
    const financeData = results[2].status === 'fulfilled' ? results[2].value : [];
    const newsData = results[3].status === 'fulfilled' ? results[3].value : [];

    const responseData = {
      military: militaryData,
      diplomacy: diplomacyData,
      finance: financeData,
      news: newsData,
    };

    return NextResponse.json(responseData, { status: 200 });

  } catch (error) {
    console.error("情報 API 發生未預期的嚴重錯誤:", error);
    return NextResponse.json({ military: [], diplomacy: [], finance: [], news: [] }, { status: 500 });
  }
}
