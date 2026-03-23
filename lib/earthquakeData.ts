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
  epicenterCoords?: [number, number]; // 地圖渲染必須的陣列格式
  intensities?: any[]; // 相容前端 UI 顯示需求
}

// 🚀 1. 真實 API 連線與破甲
export const fetchLatestEarthquake = async (): Promise<EarthquakeReport> => {
  try {
    const timestamp = new Date().getTime(); // PWA 快取破甲
    
    // 呼叫我們寫好的 Vercel 閘門
    const response = await fetch(`/api/earthquake?t=${timestamp}`, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    if (!response.ok) {
       throw new Error(`獲取地震資料失敗: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.id) {
       throw new Error("API 回傳資料格式錯誤");
    }

    // 將後端傳來的 lat/lon 轉換為前端地圖需要的 epicenterCoords 格式
    return {
      ...data,
      epicenterCoords: [data.lon, data.lat],
      intensities: data.intensities || []
    };
  } catch (error) {
    console.error("fetchLatestEarthquake 錯誤:", error);
    return {
      id: "error",
      reportType: "ERROR",
      time: new Date().toISOString(),
      epicenter: "連線異常，無法取得氣象署資料",
      magnitude: 0,
      depth: 0,
      lat: 23.5,
      lon: 121.0,
      epicenterCoords: [121.0, 23.5],
      intensities: []
    };
  }
};

// ==========================================
// 🚀 2. 核心物理演算法與地圖工具 (被誤刪的部分已補回)
// ==========================================

export function normalizeCountyName(name: string): string {
  return name.replace(/臺/g, '台');
}

export function normalizeName(name: string): string {
  return name.replace(/臺/g, '台');
}

export function getIntensityColor(intensity: string | number): string {
  const mapping: Record<string, string> = {
    '0': '#ffffff',
    '1': '#e0f7fa',
    '2': '#b2ebf2',
    '3': '#80deea',
    '4': '#fff59d',
    '5-': '#ffcc80',
    '5+': '#ffb74d',
    '6-': '#ef5350',
    '6+': '#e53935',
    '7': '#b71c1c'
  };
  return mapping[intensity.toString()] || '#ffffff';
}

// Haversine 距離公式 (計算兩點經緯度距離)
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // 地球半徑 (km)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// NCREE 地震波衰減公式 (推估各地 PGA 與 PGV)
export function calculateBaseGroundMotion(Mw: number, R: number, depth: number): { pga: number, pgv: number } {
  // 斷層距 (Rrup) 簡化估算
  const Rrup = Math.sqrt(R * R + depth * depth);
  
  // 簡易衰減模型估算 PGA (gal)
  const pga = Math.pow(10, 0.5 * Mw - Math.log10(Rrup + 0.1) - 0.002 * Rrup) * 50; 
  // 簡易衰減模型估算 PGV (cm/s)
  const pgv = pga / 10;
  
  return { pga, pgv };
}

// 中央氣象署新制震度分級轉換公式
export function getCWAIntensity(pga: number, pgv: number): string {
  if (pga < 0.8) return '0';
  if (pga < 2.5) return '1';
  if (pga < 8.0) return '2';
  if (pga < 25) return '3';
  if (pga < 80) return '4';
  
  // 震度 5 弱以上改用 PGV 判定
  if (pgv < 15) return '5-';
  if (pgv < 30) return '5+';
  if (pgv < 50) return '6-';
  if (pgv < 80) return '6+';
  return '7';
}
