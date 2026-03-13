// 定義傳入計算的資料結構
export interface TensionData {
  military: {
    aircraftSorties: number;    // 共機架次
    crossedMedianLine: number;  // 越線架次
    liveFireDrill: boolean;     // 是否有實彈演習
  };
  diplomacy: {
    travelWarningCount: number; // 提升旅遊警示的國家數量
    evacuationNotice: boolean;  // 是否有撤僑通知/演練
  };
  finance: {
    taiexDropPercent: number;   // 台股跌幅百分比 (正數代表跌幅)
    usdToTwdVolatility: number; // 美元/台幣 波動幅度
    rmbToTwdVolatility: number; // 人民幣/台幣 波動幅度
  };
  news: {
    sensitiveKeywordCount: number; // 敏感關鍵字出現次數
  };
}

// 緊張係數計算主邏輯 (滿分 100)
export function calculateTension(data: TensionData): number {
  let score = 0;

  // 1. 軍事動態 (最高 35 分)
  let militaryScore = 0;
  militaryScore += Math.min(data.military.aircraftSorties * 0.2, 10); 
  militaryScore += Math.min(data.military.crossedMedianLine * 0.5, 15); 
  if (data.military.liveFireDrill) militaryScore += 10; 
  score += Math.min(militaryScore, 35);

  // 2. 外交與撤僑 (最高 30 分)
  let diplomacyScore = 0;
  diplomacyScore += Math.min(data.diplomacy.travelWarningCount * 5, 10); 
  if (data.diplomacy.evacuationNotice) diplomacyScore += 20; // 撤僑通知極其嚴重
  score += Math.min(diplomacyScore, 30);

  // 3. 金融異動 (最高 25 分)
  let financeScore = 0;
  financeScore += Math.min(data.finance.taiexDropPercent * 2, 10); 
  financeScore += Math.min(data.finance.usdToTwdVolatility * 3, 7.5); 
  financeScore += Math.min(data.finance.rmbToTwdVolatility * 3, 7.5);
  score += Math.min(financeScore, 25);

  // 4. 新聞情緒 (最高 10 分)
  let newsScore = 0;
  newsScore += Math.min(data.news.sensitiveKeywordCount * 0.5, 10); 
  score += Math.min(newsScore, 10);

  // 四捨五入回傳整數 (保證介於 0~100)
  return Math.max(0, Math.min(Math.round(score), 100));
}

// 根據分數取得警示狀態與顏色設定
export function getTensionStatus(score: number) {
  if (score >= 80) return { label: "最高警戒", color: "bg-warning-red text-white", ring: "ring-warning-red" };
  if (score >= 60) return { label: "高度警戒", color: "bg-warning-orange text-white", ring: "ring-warning-orange" };
  if (score >= 40) return { label: "加強戒備", color: "bg-warning-yellow text-slate-900", ring: "ring-warning-yellow" };
  return { label: "狀況平常", color: "bg-warning-green text-white", ring: "ring-warning-green" };
}
