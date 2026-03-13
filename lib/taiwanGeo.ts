// lib/taiwanGeo.ts

// 1. 簡化版的台灣 SVG 路徑 (ViewBox: 0 0 200 400)
// 這是一條精簡過的向量路徑，用來作為 Canvas 的遮罩 (Mask)
export const TAIWAN_SVG_PATH = "M 130 10 L 140 20 L 135 40 L 160 80 L 175 120 L 180 180 L 170 250 L 150 320 L 120 380 L 110 390 L 100 380 L 90 350 L 70 300 L 50 250 L 40 200 L 50 150 L 80 80 L 100 40 Z";

// 2. 地圖經緯度與 ViewBox 的映射參數
// 台灣大約在 經度 119.5 ~ 122.5, 緯度 21.8 ~ 25.5
export const MAP_BOUNDS = {
  minLng: 119.5,
  maxLng: 122.5,
  minLat: 21.8,
  maxLat: 25.5,
};

// 座標轉換工具：將真實經緯度轉為 200x400 的 Canvas 像素座標
export const getPixelCoords = (lng: number, lat: number) => {
  const x = ((lng - MAP_BOUNDS.minLng) / (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng)) * 200;
  // 緯度是反向的 (畫布 Y 軸向下，緯度向北向上)
  const y = 400 - ((lat - MAP_BOUNDS.minLat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)) * 400;
  return { x, y };
};

// 3. 場址效應區域 (模擬地形對震波的放大與衰減)
// weight > 1 表示盆地放大；weight < 1 表示山脈衰減
export const SITE_EFFECTS = [
  { name: "台北盆地", lng: 121.5, lat: 25.0, radiusKm: 15, weight: 1.4 },
  { name: "宜蘭平原", lng: 121.7, lat: 24.7, radiusKm: 15, weight: 1.3 },
  { name: "嘉南平原", lng: 120.3, lat: 23.3, radiusKm: 40, weight: 1.2 },
  { name: "中央山脈", lng: 121.0, lat: 23.8, radiusKm: 60, weight: 0.7 },
];
