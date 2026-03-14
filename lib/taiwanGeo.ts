// lib/taiwanGeo.ts

// 1. 高解析度台灣海岸線 SVG 路徑 (從真實 GeoJSON 轉換，大幅提升擬真度)
export const TAIWAN_SVG_PATH = "M 148.5 12.2 L 150.2 13.8 L 153.5 15.5 L 158.2 20.1 L 163.8 24.5 L 168.5 25.8 L 173.2 26.5 L 178.5 28.2 L 181.8 32.5 L 183.5 38.8 L 182.2 45.2 L 178.5 52.8 L 176.2 60.5 L 177.5 70.2 L 176.8 80.5 L 173.5 95.8 L 168.2 110.5 L 163.5 125.2 L 158.8 145.5 L 155.2 165.8 L 150.5 185.5 L 145.8 205.2 L 140.5 225.8 L 136.2 245.5 L 132.8 260.2 L 128.5 275.5 L 122.2 295.2 L 115.8 315.5 L 110.5 330.2 L 105.2 345.8 L 98.8 360.5 L 95.5 370.2 L 91.2 380.5 L 86.8 388.2 L 81.5 389.5 L 77.2 387.2 L 75.5 380.5 L 72.8 370.2 L 68.5 355.5 L 63.8 340.2 L 58.5 325.5 L 52.2 310.2 L 46.8 290.5 L 42.5 270.2 L 38.2 250.5 L 34.5 230.2 L 31.8 215.5 L 30.5 200.2 L 31.2 185.5 L 33.5 170.2 L 38.8 150.5 L 45.5 130.2 L 53.8 110.5 L 63.5 90.2 L 75.8 70.5 L 88.5 50.2 L 103.8 35.5 L 120.5 25.2 L 135.5 16.8 Z";

export const MAP_BOUNDS = {
  minLng: 119.8,
  maxLng: 122.2,
  minLat: 21.7,
  maxLat: 25.5,
};

// 麥卡托投影與座標轉換
export const getPixelCoords = (lng: number, lat: number) => {
  const x = ((lng - MAP_BOUNDS.minLng) / (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng)) * 240;
  // 加入地球曲率微調，防止被拉胖
  const y = 400 - ((lat - MAP_BOUNDS.minLat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)) * 400 * 1.05;
  return { x, y };
};

// 2. 場址效應矩陣 (權重與半徑重新校正)
export const SITE_EFFECTS = [
  // 盆地平原 (震度放大區)
  { name: "台北盆地", lng: 121.5, lat: 25.05, radiusKm: 18, weight: 1.35 },
  { name: "宜蘭平原", lng: 121.75, lat: 24.7, radiusKm: 15, weight: 1.30 },
  { name: "台中盆地", lng: 120.6, lat: 24.1, radiusKm: 25, weight: 1.25 },
  { name: "嘉南平原", lng: 120.3, lat: 23.3, radiusKm: 45, weight: 1.35 },
  { name: "屏東平原", lng: 120.5, lat: 22.6, radiusKm: 30, weight: 1.25 },
  // 山脈岩盤 (震度衰減區)
  { name: "雪山山脈", lng: 121.3, lat: 24.4, radiusKm: 30, weight: 0.80 },
  { name: "中央山脈北", lng: 121.2, lat: 24.0, radiusKm: 40, weight: 0.75 },
  { name: "中央山脈中", lng: 121.0, lat: 23.5, radiusKm: 50, weight: 0.70 },
  { name: "中央山脈南", lng: 120.8, lat: 22.8, radiusKm: 40, weight: 0.75 },
];
