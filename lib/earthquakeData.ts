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

// 🌟 新增：終極字體翻譯蒟蒻 (消滅「臺」與「台」的差異)
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

// 🌟 修正：物理公式大進化 (強化距離衰減 -3.2，確保震央永遠最紅)
export const calculateEEWIntensity = (distance: number, magnitude: number, vs30: number) => {
  let baseI = 1.3 * magnitude - 3.2 * Math.log10(distance + 10) + 1.0;

  if (vs30 < 250) baseI += 1.0;      
  else if (vs30 < 400) baseI += 0.5; 
  else if (vs30 > 600) baseI -= 0.5; 

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
