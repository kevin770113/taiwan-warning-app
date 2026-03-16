// lib/earthquakeData.ts

// 1. 氣象署 2020 新制 10 級震度色階
export const getIntensityColor = (intensity: string) => {
  switch (intensity) {
    case "1":
    case "2": return "#86efac"; // 淺綠
    case "3": return "#fde047"; // 黃色
    case "4": return "#fb923c"; // 橘色
    case "5弱": return "#ef4444"; // 淺紅
    case "5強": return "#b91c1c"; // 深紅
    case "6弱": return "#78350f"; // 深棕
    case "6強": return "#6b21a8"; // 深紫
    case "7": return "#1e1b4b"; // 紫黑
    default: return "#f1f5f9"; // 無感或無資料
  }
};

// 2. 翻譯蒟蒻：解決 TopoJSON (2010年版) 與氣象署最新資料的名稱落差
export const normalizeCountyName = (topoName: string) => {
  const mapping: Record<string, string> = {
    "台北縣": "新北市",
    "桃園縣": "桃園市",
    "台中縣": "台中市",
    "台南縣": "台南市",
    "高雄縣": "高雄市",
  };
  return mapping[topoName] || topoName;
};

// 3. 地震資料結構 (新增震央經緯度座標)
export interface EarthquakeReport {
  id: string;
  reportType: "EEW" | "FORMAL";
  time: string;
  epicenter: string;
  epicenterCoords: [number, number]; // [經度, 緯度]
  magnitude: number;
  depth: number;
  intensities?: Record<string, string>;
}

// 4. 抓取真實 API 函數
export const fetchLatestEarthquake = async (): Promise<EarthquakeReport> => {
  // 💡 [開發者筆記] 未來只要你在氣象署開放資料平台申請了免費 API Key
  // 把下面的註解解開，就能直接串接全台灣最新一筆真實地震！
  /*
  const API_KEY = "你的氣象署API授權碼";
  const url = `https://opendata.cwa.gov.tw/api/v1/rest/datastore/E-A0015-001?Authorization=${API_KEY}&limit=1`;
  const res = await fetch(url);
  const data = await res.json();
  // ... 這裡寫 JSON 解析邏輯 ...
  */

  // 為了確保你現在不需金鑰就能測試完美架構，我直接回傳「0403花蓮大地震」的真實數據
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: "CWA-2024-0403-0758",
        reportType: "FORMAL",
        time: "2024-04-03 07:58:09",
        epicenter: "花蓮縣政府南南東方 25.0 公里",
        epicenterCoords: [121.67, 23.77], // 真實震央座標
        magnitude: 7.2,
        depth: 15.5,
        intensities: {
          "花蓮縣": "6強",
          "宜蘭縣": "5強",
          "苗栗縣": "5強",
          "台中市": "5弱",
          "彰化縣": "5弱",
          "新竹縣": "5弱",
          "南投縣": "5弱",
          "桃園市": "5弱",
          "新北市": "5弱",
          "台北市": "5弱",
          "台東縣": "4",
          "嘉義縣": "4",
          "雲林縣": "4",
          "高雄市": "4",
          "嘉義市": "4",
          "新竹市": "4",
          "台南市": "4",
          "基隆市": "4",
          "屏東縣": "4",
          "澎湖縣": "3",
          "連江縣": "2",
          "金門縣": "1"
        }
      });
    }, 800); // 模擬網路連線延遲
  });
};
