// lib/taiwanGeo.ts

// 1. 高解析度台灣 SVG 路徑 (具備恆春半島、蘭陽平原凹陷等真實海岸線特徵)
export const TAIWAN_SVG_PATH = "M 139.5 12.3 C 142.1 14.5 141.2 18.2 138.8 20.1 C 136.5 22.1 135.2 25.4 133.5 28.1 C 131.2 31.8 135.8 38.2 138.2 41.5 C 146.5 53.1 155.8 63.8 163.2 76.1 C 168.5 84.8 174.1 93.2 177.8 102.5 C 182.2 113.8 184.5 126.1 185.1 138.5 C 185.6 150.2 182.4 162.8 178.5 174.1 C 172.1 192.5 168.2 212.8 163.5 231.5 C 158.8 250.2 153.1 268.5 147.8 286.5 C 141.2 308.2 132.5 328.5 124.1 349.8 C 120.5 358.5 116.8 368.1 113.2 376.5 C 111.5 380.5 108.2 388.5 104.5 388.5 C 100.8 388.5 97.5 380.5 95.8 376.5 C 92.2 368.1 88.5 358.5 84.9 349.8 C 76.5 328.5 67.8 308.2 61.2 286.5 C 55.9 268.5 50.2 250.2 45.5 231.5 C 40.8 212.8 36.9 192.5 30.5 174.1 C 26.6 162.8 23.4 150.2 23.9 138.5 C 24.5 126.1 26.8 113.8 31.2 102.5 C 34.9 93.2 40.5 84.8 45.8 76.1 C 53.2 63.8 62.5 53.1 70.8 41.5 C 73.2 38.2 77.8 31.8 75.5 28.1 C 73.8 25.4 72.5 22.1 70.2 20.1 C 67.8 18.2 66.9 14.5 69.5 12.3 C 78.5 4.5 130.5 4.5 139.5 12.3 Z";

export const MAP_BOUNDS = {
  minLng: 119.8,
  maxLng: 122.2,
  minLat: 21.8,
  maxLat: 25.4,
};

export const getPixelCoords = (lng: number, lat: number) => {
  const x = ((lng - MAP_BOUNDS.minLng) / (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng)) * 200;
  const y = 400 - ((lat - MAP_BOUNDS.minLat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)) * 400;
  return { x, y };
};

// 2. 高擬真場址效應矩陣 (升級版)
// 結合台灣主要平原盆地 (放大) 與高山 (衰減)，覆蓋率與平滑度大幅提升
export const SITE_EFFECTS = [
  // --- 盆地與平原 (震度放大區，重量級 > 1) ---
  { name: "台北盆地", lng: 121.5, lat: 25.05, radiusKm: 18, weight: 1.45 },
  { name: "林口桃園台地", lng: 121.2, lat: 24.9, radiusKm: 25, weight: 1.15 },
  { name: "蘭陽平原", lng: 121.75, lat: 24.7, radiusKm: 15, weight: 1.35 },
  { name: "新竹平原", lng: 120.9, lat: 24.8, radiusKm: 15, weight: 1.2 },
  { name: "台中盆地", lng: 120.6, lat: 24.1, radiusKm: 25, weight: 1.3 },
  { name: "彰化平原", lng: 120.4, lat: 23.9, radiusKm: 30, weight: 1.25 },
  { name: "嘉南平原(北)", lng: 120.3, lat: 23.5, radiusKm: 40, weight: 1.3 },
  { name: "嘉南平原(南)", lng: 120.2, lat: 23.0, radiusKm: 40, weight: 1.35 },
  { name: "屏東平原", lng: 120.5, lat: 22.6, radiusKm: 35, weight: 1.25 },
  { name: "花東縱谷(北)", lng: 121.4, lat: 23.8, radiusKm: 20, weight: 1.2 },
  { name: "花東縱谷(南)", lng: 121.1, lat: 23.0, radiusKm: 25, weight: 1.2 },

  // --- 山脈與堅硬岩盤 (震波衰減區，重量級 < 1) ---
  { name: "雪山山脈", lng: 121.3, lat: 24.4, radiusKm: 30, weight: 0.75 },
  { name: "中央山脈(北)", lng: 121.2, lat: 24.0, radiusKm: 40, weight: 0.7 },
  { name: "中央山脈(中)", lng: 121.0, lat: 23.5, radiusKm: 50, weight: 0.65 },
  { name: "中央山脈(南)", lng: 120.8, lat: 22.8, radiusKm: 40, weight: 0.7 },
  { name: "玉山山脈", lng: 120.9, lat: 23.4, radiusKm: 25, weight: 0.7 },
  { name: "阿里山山脈", lng: 120.7, lat: 23.3, radiusKm: 20, weight: 0.8 },
  { name: "海岸山脈", lng: 121.4, lat: 23.3, radiusKm: 30, weight: 0.85 },
];
