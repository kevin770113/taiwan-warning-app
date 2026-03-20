// 檔案：app/api/intelligence/route.ts
import { NextResponse } from 'next/server';
import { fetchMilitaryData } from '@/lib/crawlers/military';
import { fetchDiplomacyData } from '@/lib/crawlers/diplomacy';
import { fetchFinanceData } from '@/lib/crawlers/finance';
import { fetchNewsData } from '@/lib/crawlers/news';

// 🚨 暫時強制不快取，打破 Vercel 快取鎖死，確保拿到最新的全球外交警示
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

    return NextResponse.json({
      military: militaryData,
      diplomacy: diplomacyData,
      finance: financeData,
      news: newsData,
    }, { status: 200 });

  } catch (error) {
    console.error("情報 API 發生未預期的嚴重錯誤:", error);
    return NextResponse.json({ military: [], diplomacy: [], finance: [], news: [] }, { status: 500 });
  }
}
