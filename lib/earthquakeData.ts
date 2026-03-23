// 檔案：lib/earthquakeData.ts

export interface EarthquakeReport {
  id: string;
  reportType: string;
  time: string;
  epicenter: string;
  magnitude: number;
  depth: number;
  lat: number;
  lon: number;
}

export const fetchLatestEarthquake = async (): Promise<EarthquakeReport> => {
  try {
    // 🚨 PWA 終極破甲：加入毫秒級時間戳，徹底摧毀手機的 Service Worker 舊快取
    const timestamp = new Date().getTime();
    
    // 我們的 App 不直接找氣象署，而是找我們自己剛寫好的 Vercel 閘門
    const response = await fetch(`/api/earthquake?t=${timestamp}`, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    if (!response.ok) {
       throw new Error(`獲取地震資料失敗: ${response.status}`);
    }

    const data: EarthquakeReport = await response.json();
    
    if (!data.id) {
       throw new Error("API 回傳資料格式錯誤");
    }

    return data;
  } catch (error) {
    console.error("fetchLatestEarthquake 錯誤:", error);
    // 萬一真的連線失敗，回傳一個系統提示作為最後防線
    return {
      id: "error",
      reportType: "ERROR",
      time: new Date().toISOString(),
      epicenter: "連線異常，無法取得氣象署資料",
      magnitude: 0,
      depth: 0,
      lat: 23.5,
      lon: 121.0
    };
  }
};
