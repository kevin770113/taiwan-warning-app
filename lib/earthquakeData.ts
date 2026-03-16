// lib/earthquakeData.ts

export const getIntensityColor = (intensity: string) => {
  switch (intensity) {
    case "1":
    case "2": return "#86efac";
    case "3": return "#fde047";
    case "4": return "#fb923c";
    case "5弱": return "#ef4444";
    case "5強": return "#b91c1c";
    case "6弱": return "#78350f";
    case "6強": return "#6b21a8";
    case "7": return "#1e1b4b";
    default: return "#f1f5f9";
  }
};

export const normalizeCountyName = (topoName: string) => {
  const mapping: Record<string, string> = {
    "台北縣": "新北市", "桃園縣": "桃園市", "台中縣": "台中市", 
    "台南縣": "台南市", "高雄縣": "高雄市",
  };
  return mapping[topoName] || topoName;
};

// 🌟 新增：計算兩座標距離 (公里) - Haversine Formula
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// 🌟 新增：GMPE 地動衰減方程式 (導入 Vs30 場址效應)
export const calculateEEWIntensity = (distance: number, magnitude: number, vs30: number) => {
  // 基礎對數衰減 (距離越遠掉越快)
  let baseI = 1.2 * magnitude - 2.5 * Math.log10(distance + 15) + 2.5;

  // 場址效應放大 (Site Effect)
  if (vs30 < 250) baseI += 1.0;      // 軟泥盆地 (極度放大)
  else if (vs30 < 400) baseI += 0.5; // 沖積平原 (中度放大)
  else if (vs30 > 600) baseI -= 0.5; // 堅硬岩盤 (衰減)

  if (baseI < 0) return "0";
  if (baseI < 2.5) return "2";
  if (baseI < 3.5) return "3";
  if (baseI < 4.5) return "4";
  if (baseI < 5.0) return "5弱";
  if (baseI < 5.5) return "5強";
  if (baseI < 6.0) return "6弱";
  if (baseI < 6.5) return "6強";
  return "7";
};

export interface EarthquakeReport {
  id: string;
  reportType: "EEW" | "FORMAL";
  time: string;
  epicenter: string;
  epicenterCoords: [number, number];
  magnitude: number;
  depth: number;
  intensities?: Record<string, string>;
}

export const fetchLatestEarthquake = async (): Promise<EarthquakeReport> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: "CWA-2024-0403-0758",
        reportType: "FORMAL",
        time: "2024-04-03 07:58:09",
        epicenter: "花蓮縣政府南南東方 25.0 公里",
        epicenterCoords: [121.67, 23.77], 
        magnitude: 7.2,
        depth: 15.5,
        intensities: {
          "花蓮縣": "6強", "宜蘭縣": "5強", "苗栗縣": "5強", "台中市": "5弱",
          "彰化縣": "5弱", "新竹縣": "5弱", "南投縣": "5弱", "桃園市": "5弱",
          "新北市": "5弱", "台北市": "5弱", "台東縣": "4", "嘉義縣": "4",
          "雲林縣": "4", "高雄市": "4", "嘉義市": "4", "新竹市": "4",
          "台南市": "4", "基隆市": "4", "屏東縣": "4", "澎湖縣": "3"
        }
      });
    }, 600);
  });
};
