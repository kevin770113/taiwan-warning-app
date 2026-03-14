// lib/taiwanGeo.ts

// 1. 真實台灣海岸線經緯度錨點 (精確勾勒出台灣番薯形狀，絕不變形)
export const TAIWAN_COORDS: [number, number][] = [
  [121.54, 25.30], // 富貴角
  [121.65, 25.26], // 金山
  [121.75, 25.15], // 基隆
  [121.90, 25.08], // 鼻頭角
  [122.00, 25.01], // 三貂角
  [121.90, 24.88], // 頭城
  [121.85, 24.75], // 壯圍
  [121.85, 24.60], // 蘇澳
  [121.80, 24.45], // 南澳
  [121.65, 24.10], // 七星潭
  [121.60, 23.85], // 壽豐
  [121.55, 23.50], // 長濱
  [121.36, 23.10], // 成功
  [121.20, 22.80], // 台東
  [120.95, 22.40], // 太麻里
  [120.89, 22.25], // 大武
  [120.84, 21.90], // 鵝鑾鼻
  [120.74, 21.93], // 貓鼻頭
  [120.70, 22.05], // 車城
  [120.60, 22.25], // 枋山
  [120.52, 22.40], // 枋寮
  [120.45, 22.50], // 東港
  [120.25, 22.60], // 高雄
  [120.15, 22.80], // 梓官
  [120.15, 23.00], // 台南
  [120.10, 23.20], // 北門
  [120.15, 23.40], // 布袋
  [120.13, 23.55], // 東石
  [120.20, 23.75], // 台西
  [120.30, 23.90], // 芳苑
  [120.45, 24.10], // 鹿港
  [120.50, 24.25], // 梧棲
  [120.60, 24.35], // 大甲
  [120.75, 24.55], // 後龍
  [120.85, 24.70], // 竹南
  [120.92, 24.85], // 南寮
  [121.03, 25.02], // 新屋
  [121.20, 25.12], // 大園
  [121.40, 25.20], // 八里
];

// 2. 麥卡托投影換算引擎 (動態適應 Canvas 大小，維持真實比例)
export const getProjectedCoords = (lng: number, lat: number, width: number, height: number) => {
  // 台灣邊界 + 留白 padding
  const minLng = 119.9, maxLng = 122.2;
  const minLat = 21.7, maxLat = 25.5;
  
  // 地球曲率校正：緯度 23.5 度時，經度的實際距離會縮短 (cos(23.5) 約 0.917)
  const cosLat = Math.cos(23.5 * Math.PI / 180);
  
  const mapWidth = (maxLng - minLng) * cosLat;
  const mapHeight = maxLat - minLat;
  
  // 計算縮放比例，確保地圖完整置中不變形
  const scale = Math.min(width / mapWidth, height / mapHeight) * 0.9;
  
  const x = ((lng - minLng) * cosLat) * scale + (width - mapWidth * scale) / 2;
  const y = height - (((lat - minLat) * scale) + (height - mapHeight * scale) / 2);
  
  return { x, y };
};

// 3. 場址效應矩陣 (維持高精度設定)
export const SITE_EFFECTS = [
  { name: "台北盆地", lng: 121.5, lat: 25.05, radiusKm: 18, weight: 1.45 },
  { name: "林口桃園台地", lng: 121.2, lat: 24.9, radiusKm: 25, weight: 1.15 },
  { name: "蘭陽平原", lng: 121.75, lat: 24.7, radiusKm: 15, weight: 1.35 },
  { name: "新竹平原", lng: 120.9, lat: 24.8, radiusKm: 15, weight: 1.2 },
  { name: "台中盆地", lng: 120.6, lat: 24.1, radiusKm: 25, weight: 1.3 },
  { name: "彰化平原", lng: 120.4, lat: 23.9, radiusKm: 30, weight: 1.25 },
  { name: "嘉南平原", lng: 120.3, lat: 23.3, radiusKm: 60, weight: 1.3 },
  { name: "屏東平原", lng: 120.5, lat: 22.6, radiusKm: 35, weight: 1.25 },
  { name: "花東縱谷", lng: 121.2, lat: 23.4, radiusKm: 50, weight: 1.2 },
  { name: "雪山山脈", lng: 121.3, lat: 24.4, radiusKm: 30, weight: 0.75 },
  { name: "中央山脈", lng: 121.0, lat: 23.5, radiusKm: 80, weight: 0.65 },
];
