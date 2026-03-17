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

// 🌟 核心一：同時計算 PGA(加速度) 與 PGV(速度) 的衰減公式
export const calculateBaseGroundMotion = (distance: number, magnitude: number, vs30: number) => {
  // 1. PGA 運算
  const logPGA = 0.5 * magnitude - 1.8 * Math.log10(distance + 10) + 1.8;
  let pga = Math.pow(10, logPGA);
  const siteEffectPGA = Math.sqrt(800 / Math.max(vs30, 150));
  
  // 2. PGV 運算 (速度波對長距離的衰減較慢，但對盆地效應極度敏感)
  const logPGV = 0.65 * magnitude - 1.6 * Math.log10(distance + 10) - 0.5;
  let pgv = Math.pow(10, logPGV);
  const siteEffectPGV = Math.sqrt(800 / Math.max(vs30, 100));

  return { 
    pga: pga * siteEffectPGA, 
    pgv: pgv * siteEffectPGV 
  };
};

// 🌟 核心二：氣象署 2020 新制震度分級 (PGA/PGV 雙軌判定)
export const getCWAIntensity = (pga: number, pgv: number) => {
  if (pga < 0.8) return "0";
  if (pga < 2.5) return "1";
  if (pga < 8.0) return "2";
  if (pga < 25) return "3";
  if (pga < 80) return "4";

  // 🚨 PGA 超過 80 gal (5弱標準) 時，強制切換為 PGV 判定！
  if (pgv < 15) return "4";  // 高頻短波，搖晃時間短，降級回4級
  if (pgv < 30) return "5弱"; // 真正的低頻長週期破壞力
  if (pgv < 50) return "5強";
  if (pgv < 80) return "6弱";
  if (pgv < 140) return "6強";
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
