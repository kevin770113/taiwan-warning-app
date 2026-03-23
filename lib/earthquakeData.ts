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
  epicenterCoords?: [number, number];
  intensities?: Record<string, string>; 
}

// 🚀 1. 真實 API 連線與破甲
export const fetchLatestEarthquake = async (): Promise<EarthquakeReport> => {
  try {
    const timestamp = new Date().getTime(); 
    
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

    return {
      ...data,
      epicenterCoords: [data.lon, data.lat],
      intensities: data.intensities || {} 
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
      intensities: {} 
    };
  }
};

// ==========================================
// 🚀 2. 核心物理演算法與地圖工具 
// ==========================================

export function normalizeCountyName(name: string): string {
  return name.replace(/臺/g, '台');
}

export function normalizeName(name: string): string {
  return name.replace(/臺/g, '台');
}

// 🚨 終極對齊：將色碼 100% 同步為前端 page.tsx 圖例設定的 Tailwind Hex 色碼
export function getIntensityColor(intensity: string | number): string {
  const mapping: Record<string, string> = {
    '0': '#ffffff',
    '1': '#bbf7d0',   // 1級：淺綠 (對應 Tailwind green-200)
    '2': '#4ade80',   // 2級：綠色 (對應 Tailwind green-400)
    '3': '#facc15',   // 3級：黃色 (對應 Tailwind yellow-400)
    '4': '#f97316',   // 4級：橘色 (對應 Tailwind orange-500)
    '5-': '#ef4444',  // 5弱：紅色 (對應您圖例的設定)
    '5+': '#b91c1c',  // 5強：深紅色 (對應您圖例的設定)
    '6-': '#78350f',  // 6弱：咖啡色 (對應您圖例的設定)
    '6+': '#451a03',  // 6強：深咖啡色 (對應您圖例的設定)
    '7': '#312e81'    // 7級：深紫色
  };
  return mapping[intensity.toString()] || '#ffffff';
}

// Haversine 距離公式
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// NCREE 地震波衰減公式
export function calculateBaseGroundMotion(Mw: number, R: number, depth: number): { pga: number, pgv: number } {
  const Rrup = Math.sqrt(R * R + depth * depth);
  const pga = Math.pow(10, 0.5 * Mw - Math.log10(Rrup + 0.1) - 0.002 * Rrup) * 50; 
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
  
  if (pgv < 15) return '5-';
  if (pgv < 30) return '5+';
  if (pgv < 50) return '6-';
  if (pgv < 80) return '6+';
  return '7';
}
