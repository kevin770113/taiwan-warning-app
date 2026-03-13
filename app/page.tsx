import { calculateTension, getTensionStatus, type TensionData } from "@/lib/calculateTension";
import { Clock, Crosshair, Globe, TrendingDown, Newspaper, AlertTriangle } from "lucide-react";

export default function Home() {
  // 模擬從後端 API 抓取到的最新數據 (你可以隨意修改這些數字來測試儀表板變色！)
  const mockData: TensionData = {
    military: { aircraftSorties: 15, crossedMedianLine: 4, liveFireDrill: false },
    diplomacy: { travelWarningCount: 1, evacuationNotice: false },
    finance: { taiexDropPercent: 1.2, usdToTwdVolatility: 0.3, rmbToTwdVolatility: 0.1 },
    news: { sensitiveKeywordCount: 12 },
  };

  // 根據數據計算總分與狀態
  const score = calculateTension(mockData);
  const status = getTensionStatus(score);

  // Tailwind 安全的顏色對應表 (確保編譯器能正確產生顏色)
  const colorMap = {
    "最高警戒": { border: "border-warning-red", text: "text-warning-red", glow: "bg-warning-red" },
    "高度警戒": { border: "border-warning-orange", text: "text-warning-orange", glow: "bg-warning-orange" },
    "加強戒備": { border: "border-warning-yellow", text: "text-warning-yellow", glow: "bg-warning-yellow" },
    "狀況平常": { border: "border-warning-green", text: "text-warning-green", glow: "bg-warning-green" },
  };
  const theme = colorMap[status.label as keyof typeof colorMap] || colorMap["狀況平常"];

  return (
    <div className="min-h-screen pt-6 px-4 pb-24 flex flex-col gap-6">
      {/* 1. 頂部狀態區 (Header) */}
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">情報總覽</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">台海戰爭預警系統</p>
        </div>
        <div className="flex items-center text-xs text-slate-500 bg-slate-200/50 px-2 py-1 rounded-md">
          <Clock size={12} className="mr-1" />
          <span>更新於 10 分鐘前</span>
        </div>
      </header>

      {/* 2. 核心警報儀表板 (Hero Dashboard) */}
      <section className={`relative w-full rounded-3xl p-6 shadow-lg flex flex-col items-center justify-center overflow-hidden bg-white border-2 ${theme.border}`}>
        {/* 背景裝飾光暈 */}
        <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-10 blur-2xl ${theme.glow}`}></div>
        
        <h2 className="text-sm font-bold text-slate-500 mb-2 uppercase tracking-widest">當前緊張係數</h2>
        
        {/* 數字儀表 */}
        <div className={`w-40 h-40 rounded-full flex flex-col items-center justify-center border-[8px] ${theme.border} border-opacity-20 relative`}>
          <span className={`text-6xl font-black ${theme.text}`}>
            {score}
          </span>
          <span className="text-slate-400 text-sm font-medium mt-1">/ 100</span>
        </div>

        {/* 狀態標籤 */}
        <div className={`mt-6 px-6 py-2 rounded-full text-sm font-bold tracking-wide shadow-sm ${status.color}`}>
          {status.label}
        </div>
      </section>

      {/* 3. 四大指標狀態卡片 (Indicator Cards) */}
      <section className="grid grid-cols-2 gap-3">
        {/* 軍事 */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
              <Crosshair size={18} />
            </div>
            <h3 className="font-bold text-slate-700 text-sm">軍事動態</h3>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1">{mockData.military.aircraftSorties} <span className="text-xs text-slate-500 font-normal">架次</span></p>
          <p className="text-xs text-red-500 font-medium mt-1">越線 {mockData.military.crossedMedianLine} 架次</p>
        </div>

        {/* 外交 */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Globe size={18} />
            </div>
            <h3 className="font-bold text-slate-700 text-sm">外交撤僑</h3>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1">{mockData.diplomacy.travelWarningCount} <span className="text-xs text-slate-500 font-normal">國</span></p>
          <p className="text-xs text-slate-500 font-medium mt-1">提升旅遊警示</p>
        </div>

        {/* 金融 */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingDown size={18} />
            </div>
            <h3 className="font-bold text-slate-700 text-sm">金融異動</h3>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1">-{mockData.finance.taiexDropPercent}%</p>
          <p className="text-xs text-slate-500 font-medium mt-1">台股大盤跌幅</p>
        </div>

        {/* 新聞 */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Newspaper size={18} />
            </div>
            <h3 className="font-bold text-slate-700 text-sm">新聞情緒</h3>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1">{mockData.news.sensitiveKeywordCount} <span className="text-xs text-slate-500 font-normal">則</span></p>
          <p className="text-xs text-slate-500 font-medium mt-1">敏感關鍵字觸發</p>
        </div>
      </section>

      {/* 4. 最新關鍵動態跑馬燈/列表 (Latest Alerts) */}
      <section className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex gap-3 items-start shadow-sm">
        <AlertTriangle className="text-warning-orange shrink-0 mt-0.5" size={20} />
        <div>
          <h4 className="text-sm font-bold text-orange-900 mb-1">最新警示動態</h4>
          <p className="text-xs text-orange-800 leading-relaxed">
            國防部發布偵獲共機 15 架次，其中 4 架次逾越海峽中線。美方微幅提升台海周邊旅遊注意層級。
          </p>
        </div>
      </section>
    </div>
  );
}
