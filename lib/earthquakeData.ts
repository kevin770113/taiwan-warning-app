// lib/earthquakeData.ts

export const getIntensityColor = (intensity: string) => {
  switch (intensity) {
    case "1": return "#86efac";
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

export const normalizeName = (name: string) => {
  if (!name) return "";
  return name.replace(/臺/g, "台");
};

export const normalizeCountyName = (topoName: string) => {
  const n = normalizeName(topoName);
  const mapping: Record<string, string> = {
    "台北縣": "新北市", "桃園縣": "桃園市", "台中縣": "台中市", 
    "台南縣": "台南市", "高雄縣": "高雄市",
  };
  return mapping[n] || n;
};

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

// 🌟 終極科學進化：PGA (地表最大加速度) 衰減與場址乘數模型
export const calculateEEWIntensity = (distance: number, magnitude: number, vs30: number) => {
  // 1. 基盤 PGA 衰減公式 (對數衰減，距離越遠能量急遽下降)
  const logPGA = 0.5 * magnitude - 1.5 * Math.log10(distance + 15) + 1.5;
  let pga = Math.pow(10, logPGA);

  // 2. Vs30 場址效應 (改為乘數 Amplification Factor)
  if (vs30 < 250) pga *= 2.0;       // 軟弱盆地/沖積平原：放大 2 倍
  else if (vs30 < 400) pga *= 1.4;  // 一般平原：放大 1.4 倍
  else if (vs30 > 600) pga *= 0.7;  // 堅硬岩盤：能量衰減 0.7 倍

  // 3. 嚴格對射氣象署 10 級震度 (PGA gal 值標準)
  if (pga < 0.8) return "0";
  if (pga < 2.5) return "1";
  if (pga < 8.0) return "2";
  if (pga < 25) return "3";
  if (pga < 80) return "4";
  if (pga < 140) return "5弱";
  if (pga < 250) return "5強";
  if (pga < 400) return "6弱";
  if (pga < 800) return "6強";
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
          "花蓮縣": "6弱",
          "花蓮市": "6強", 
          "壽豐鄉": "6強",
          "吉安鄉": "5強",
          "宜蘭縣": "5強", 
          "南澳鄉": "6弱",
          "新北市": "5弱", 
          "新店區": "5強",
          "信義區": "4",
          "大安區": "4",
          "台中市": "5弱",
          "和平區": "5強",
          "彰化縣": "5弱", 
          "桃園市": "5弱",
          "台北市": "5弱", 
          "台東縣": "4", 
          "嘉義縣": "4",
          "雲林縣": "4", 
          "高雄市": "4", 
          "台南市": "4", 
          "屏東縣": "4", 
        }
      });
    }, 600);
  });
};
