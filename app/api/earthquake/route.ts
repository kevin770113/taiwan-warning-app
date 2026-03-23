// 檔案：app/api/earthquake/route.ts
import { NextResponse } from 'next/server';

export const revalidate = 60;

export async function GET() {
  try {
    const apiKey = process.env.CWA_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API 金鑰未設定" }, { status: 500 });
    }

    const url = `https://opendata.cwa.gov.tw/api/v1/rest/datastore/E-A0015-001?Authorization=${apiKey}&limit=1&format=JSON`;
    const response = await fetch(url, {
      next: { revalidate: 60 }
    });

    if (!response.ok) {
      throw new Error(`氣象署 API 回應錯誤: ${response.status}`);
    }

    const data = await response.json();
    const records = data.records?.Earthquake;

    if (!records || records.length === 0) {
      return NextResponse.json({ error: "找不到地震資料" }, { status: 404 });
    }

    const latestEq = records[0];
    const eqInfo = latestEq.EarthquakeInfo;

    // 🚨 終極修復一：將氣象署的各地震度陣列，轉譯成前端地圖能懂的 {"台北市": "3", "花蓮縣": "4"}
    const intensitiesMap: Record<string, string> = {};
    const shakingAreas = latestEq.Intensity?.ShakingArea;
    if (Array.isArray(shakingAreas)) {
      shakingAreas.forEach((area: any) => {
        const name = area.CountyName || area.AreaName;
        const intensityStr = area.AreaIntensity || area.MaximumEarthquakeIntensity;
        if (name && intensityStr) {
          let val = intensityStr.toString().replace("級", "").trim();
          val = val.replace("弱", "-").replace("強", "+");
          const normName = name.replace(/臺/g, "台"); // 對齊前端地圖名稱
          if (!intensitiesMap[normName]) {
            intensitiesMap[normName] = val;
          }
        }
      });
    }

    const transformedData = {
      id: latestEq.EarthquakeNo.toString(),
      reportType: "FORMAL",
      time: eqInfo.OriginTime,
      epicenter: eqInfo.Epicenter.Location,
      magnitude: eqInfo.EarthquakeMagnitude.MagnitudeValue,
      depth: eqInfo.FocalDepth,
      lat: eqInfo.Epicenter.EpicenterLatitude,
      lon: eqInfo.Epicenter.EpicenterLongitude,
      intensities: intensitiesMap, // 補上原本遺失的震度字典
    };

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error("地震 API 發生例外錯誤:", error);
    return NextResponse.json({ error: "無法取得地震資料" }, { status: 500 });
  }
}
