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

export const fetchLatestEarthquake = async (): Promise<EarthquakeReport> => {
  try {
    const timestamp = new Date().getTime(); 
    const response = await fetch(`/api/earthquake?t=${timestamp}`, {
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
    });
    if (!response.ok) throw new Error(`獲取地震資料失敗: ${response.status}`);
    const data = await response.json();
    if (!data.id) throw new Error("API 回傳資料格式錯誤");

    return {
      ...data,
      epicenterCoords: [data.lon, data.lat],
      intensities: data.intensities || {} 
    };
  } catch (error) {
    console.error("fetchLatestEarthquake 錯誤:", error);
    return {
      id: "error", reportType: "ERROR", time: new Date().toISOString(),
      epicenter: "連線異常，無法取得氣象署資料", magnitude: 0, depth: 0,
      lat: 23.5, lon: 121.0, epicenterCoords: [121.0, 23.5], intensities: {} 
    };
  }
};

export function normalizeCountyName(name: string): string {
  return name.replace(/臺/g, '台');
}

export function normalizeName(name: string): string {
  return name.replace(/臺/g, '台');
}

export function getIntensityColor(intensity: string | number): string {
  const mapping: Record<string, string> = {
    '0': '#ffffff',
    '1': '#bbf7d0',   
    '2': '#4ade80',   
    '3': '#facc15',   
    '4': '#f97316',   
    '5-': '#ef4444',  
    '5+': '#b91c1c',  
    '6-': '#78350f',  
    '6+': '#451a03',  
    '7': '#312e81'    
  };
  return mapping[intensity.toString()] || '#ffffff';
}

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

// 🚀 新增：計算兩點之間的方位角 (Bearing / Azimuth)，用以判斷震波是否撞山
export function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const phi1 = lat1 * Math.PI / 180;
  const phi2 = lat2 * Math.PI / 180;
  const y = Math.sin(dLon) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLon);
  return Math.atan2(y, x); // 回傳弧度 (Radians)
}

// 🚀 高階 GMPE 物理引擎升級：導入對數衰減與異向性
export function calculateBaseGroundMotion(Mw: number, R: number, depth: number, azimuthRad: number = 0): { pga: number, pgv: number } {
  // 1. 異向性懲罰 (Anisotropy Penalty)
  // 現實中台灣東西向 (E-W) 震波受中央山脈阻擋，衰減極快。利用正弦函數找出 E-W 分量。
  const directionalPenalty = 1 + 0.35 * Math.pow(Math.sin(azimuthRad), 2); 
  const R_eff = R * directionalPenalty; // 東西向等效距離被拉長，加速衰減
  const Rrup = Math.sqrt(R_eff * R_eff + depth * depth);

  // 2. 台灣區高階對數地動方程式 (Logarithmic GMPE)
  // 完美還原 M5.0 威力隨距離指數型陡降的現實物理特性
  const logPGA = 0.6 * Mw - 1.5 * Math.log10(Rrup + 10) - 0.003 * Rrup + 1.0;
  const pga = Math.pow(10, logPGA);

  // PGV (長週期波) 幾何衰減較慢，具備較強的繞射能力
  const logPGV = 0.65 * Mw - 1.4 * Math.log10(Rrup + 10) - 0.002 * Rrup - 0.5;
  const pgv = Math.pow(10, logPGV);

  return { pga, pgv };
}

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
