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

// 🌟 終極科學進化：PGA (地表最大加速度) 衰減與連續場址乘數模型
export const calculateEEWIntensity = (distance: number, magnitude: number, vs30: number) => {
  // 1. 基盤 PGA 衰減公式 (更陡峭的衰減，距離懲罰加重)
  const logPGA = 0.5 * magnitude - 1.8 * Math.log10(distance + 10) + 1.8;
  let pga = Math.pow(10, logPGA);

  // 2. Vs30 連續場址效應公式 (非線性乘數，直接反映地質破碎度)
  // vs30 越小，乘數越大。例如 vs30=200 -> sqrt(800/200)=2.0 倍
  const siteEffect = Math.sqrt(800 / Math.max(vs30, 150));
  pga *= siteEffect;

  // 3. 嚴格對射氣象署 10 級震度
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
        // 🌟 補齊全台 22 縣市資料！並加入更多山區鄉鎮，展現完美填色實力
        intensities: {
          "花蓮縣": "6弱", "花蓮市": "6強", "壽豐鄉": "6強", "吉安鄉": "5強",
          "宜蘭縣": "5強", "南澳鄉": "6弱",
          "新北市": "5弱", "新店區": "5強",
          "台北市": "5弱", "信義區": "4", "大安區": "4",
          "基隆市": "4",
          "桃園市": "5弱",
          "新竹縣": "4", "新竹市": "4",
          "苗栗縣": "4", "泰安鄉": "5弱",
          "台中市": "5弱", "和平區": "5強",
          "彰化縣": "4",
          "南投縣": "5弱", "仁愛鄉": "5強",
          "雲林縣": "4",
          "嘉義縣": "4", "嘉義市": "4", "阿里山鄉": "5弱",
          "台南市": "4",
          "高雄市": "4", "桃源區": "5弱",
          "屏東縣": "4",
          "台東縣": "4", "成功鎮": "5弱",
          "澎湖縣": "3",
          "金門縣": "2",
          "連江縣": "2"
        }
      });
    }, 600);
  });
};
