// lib/earthquakeData.ts

// 1. 定義氣象署 2020 新制 10 級震度色階
export const getIntensityColor = (intensity: string) => {
  switch (intensity) {
    case "1":
    case "2":
      return "#86efac"; // 淺綠 (1-2級)
    case "3":
      return "#fde047"; // 黃色 (3級)
    case "4":
      return "#fb923c"; // 橘色 (4級)
    case "5弱":
      return "#ef4444"; // 淺紅 (5弱)
    case "5強":
      return "#b91c1c"; // 深紅 (5強)
    case "6弱":
      return "#78350f"; // 深棕 (6弱)
    case "6強":
      return "#6b21a8"; // 深紫 (6強)
    case "7":
      return "#1e1b4b"; // 紫黑 (7級)
    default:
      return "#f1f5f9"; // 預設底色 (無感或無資料：淡灰)
  }
};

// 2. 模擬氣象署 API 回傳的資料結構
export interface EarthquakeReport {
  id: string;
  reportType: "EEW" | "FORMAL"; // EEW=速報(無詳細震度), FORMAL=正式報告(有詳細震度)
  time: string;
  epicenter: string;
  magnitude: number;
  depth: number;
  // 紀錄各縣市的「最大震度」 (只有 FORMAL 報告才會有這包資料)
  intensities?: Record<string, string>; 
}

// 3. 準備一筆測試用的假資料 (模擬發生在花蓮的規模 6.2 強震)
export const mockFormalReport: EarthquakeReport = {
  id: "CWA-2026-0315-001",
  reportType: "FORMAL",
  time: "2026-03-15 14:30:00",
  epicenter: "花蓮縣政府南南東方 25.4 公里",
  magnitude: 6.2,
  depth: 15.5,
  intensities: {
    "花蓮縣": "6弱",
    "台東縣": "5強",
    "南投縣": "5弱",
    "宜蘭縣": "4",
    "台中市": "4",
    "彰化縣": "4",
    "雲林縣": "4",
    "嘉義縣": "4",
    "苗栗縣": "3",
    "新竹縣": "3",
    "桃園市": "3",
    "新北市": "3",
    "台北市": "3",
    "高雄市": "2",
    "台南市": "2",
    "屏東縣": "2",
    "基隆市": "2",
    "新竹市": "2",
    "嘉義市": "2",
  }
};
