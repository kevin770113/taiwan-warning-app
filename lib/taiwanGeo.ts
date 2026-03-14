// 1. 真實台灣海岸線精確映射路徑 (消除 AI 幻覺，基於實際經緯度轉換)
export const TAIWAN_SVG_PATH = "M 145 11 L 155 18 L 162 27 L 176 30 L 183 43 L 168 55 L 170 88 L 162 120 L 150 155 L 140 200 L 131 255 L 120 275 L 112 294 L 95 350 L 87 388 L 82 385 L 77 386 L 70 360 L 65 337 L 55 325 L 40 311 L 31 266 L 29 216 L 30 195 L 37 172 L 45 150 L 58 127 L 70 105 L 83 88 L 93 61 L 108 38 L 120 28 L 133 22 Z";

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

// 2. 場址效應矩陣 (維持不變)
export const SITE_EFFECTS = [
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
  { name: "雪山山脈", lng: 121.3, lat: 24.4, radiusKm: 30, weight: 0.75 },
  { name: "中央山脈(北)", lng: 121.2, lat: 24.0, radiusKm: 40, weight: 0.7 },
  { name: "中央山脈(中)", lng: 121.0, lat: 23.5, radiusKm: 50, weight: 0.65 },
  { name: "中央山脈(南)", lng: 120.8, lat: 22.8, radiusKm: 40, weight: 0.7 },
  { name: "玉山山脈", lng: 120.9, lat: 23.4, radiusKm: 25, weight: 0.7 },
  { name: "阿里山山脈", lng: 120.7, lat: 23.3, radiusKm: 20, weight: 0.8 },
  { name: "海岸山脈", lng: 121.4, lat: 23.3, radiusKm: 30, weight: 0.85 },
];
