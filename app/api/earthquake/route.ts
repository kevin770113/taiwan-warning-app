// 檔案：app/api/earthquake/route.ts
import { NextResponse } from 'next/server';

// 🚨 快取盾牌：告訴 Vercel 每 60 秒才重新向氣象署要一次資料，保護金鑰不被流量打爆
export const revalidate = 60;

export async function GET() {
  try {
    const apiKey = process.env.CWA_API_KEY;
    if (!apiKey) {
      console.error("Vercel 環境變數缺少 CWA_API_KEY");
      return NextResponse.json({ error: "API 金鑰未設定" }, { status: 500 });
    }

    // 氣象署 E-A0015-001：顯著有感地震報告 API
    const url = `https://opendata.cwa.gov.tw/api/v1/rest/datastore/E-A0015-001?Authorization=${apiKey}&limit=1&format=JSON`;

    // 透過 Vercel 伺服器去向氣象署發出請求
    const response = await fetch(url, {
      next: { revalidate: 60 } // 雙重確認快取 60 秒
    });

    if (!response.ok) {
      throw new Error(`氣象署 API 回應錯誤: ${response.status}`);
    }

    const data = await response.json();
    const records = data.records?.Earthquake;

    if (!records || records.length === 0) {
      return NextResponse.json({ error: "找不到地震資料" }, { status: 404 });
    }

    // 取得最新的一筆地震資料
    const latestEq = records[0];
    const eqInfo = latestEq.EarthquakeInfo;

    // 🚨 零妥協清洗：把氣象署複雜的 JSON，轉譯成我們前端 NCREE 演算法需要的完美格式
    const transformedData = {
      id: latestEq.EarthquakeNo.toString(),
      reportType: "FORMAL",
      time: eqInfo.OriginTime,
      epicenter: eqInfo.Epicenter.Location,
      magnitude: eqInfo.EarthquakeMagnitude.MagnitudeValue,
      depth: eqInfo.FocalDepth,
      lat: eqInfo.Epicenter.EpicenterLatitude,
      lon: eqInfo.Epicenter.EpicenterLongitude,
    };

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error("地震 API 發生例外錯誤:", error);
    return NextResponse.json({ error: "無法取得地震資料" }, { status: 500 });
  }
}
