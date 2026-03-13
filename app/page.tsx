import { calculateTension, getTensionStatus, type TensionData } from "@/lib/calculateTension";
import { Clock, Crosshair, Globe, TrendingDown, Newspaper, ShieldCheck } from "lucide-react";

export default function Home() {
  // 模擬數據 (維持不變)
  const mockData: TensionData = {
    military: { aircraftSorties: 15, crossedMedianLine: 4, liveFireDrill: false },
    diplomacy: { travelWarningCount: 1, evacuationNotice: false },
    finance: { taiexDropPercent: 1.2, usdToTwdVolatility: 0.3, rmbToTwdVolatility: 0.1 },
    news: { sensitiveKeywordCount: 12 },
  };

  // 取得後端計算的分數與原始狀態
  const score = calculateTension(mockData);
  const rawStatus = getTensionStatus(score);

  // 【UX 柔化處理】將後端的嚴厲字眼與顏色，轉換為前端安定情緒的色調與文字
  const softUITheme = {
    "最高警戒": { label: "需密切關注", color: "text-rose-500", bg: "bg-rose-50", border: "border-rose-200" },
    "高度警戒": { label: "局勢波動", color: "text-orange-500", bg: "bg-orange-50", border: "border-orange-200" },
    "加強戒備": { label: "適度關注", color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-200" },
    "狀況平常": { label: "局勢安定", color: "text-teal-600", bg: "bg-teal-50", border: "border-teal-200" },
  };
  const theme = softUITheme[rawStatus.label as keyof typeof softUITheme] || softUITheme["狀況平常"];

  return (
    <div className="min-h-screen bg-[#f8fafc] pt-6 px-5 pb-24 flex flex-col gap-6 font-sans">
      {/* 1. 頂部狀態區 (Header) */}
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">台海動態總覽</h1>
          <p className="text-sm text-slate-500 mt-1">客觀數據 • 安定守護</p>
        </div>
        <div className="flex items-center text-xs text-slate-400 bg-white border border-slate-100 px-3 py-1.5 rounded-full shadow-sm">
          <Clock size={14} className="mr-1.5" />
          <span>10 分鐘前更新</span>
        </div>
      </header>

      {/* 2. 核心半圓形儀表板 (Fear & Greed Style Gauge) */}
      <section className="w-full bg-white rounded-3xl p-6 shadow-[0_2px_20px_rgb(0,0,0,0.03)] border border-slate-100 flex flex-col items-center relative overflow-hidden">
        <h2 className="text-sm font-semibold text-slate-500 mb-6 tracking-wider">整體局勢指標</h2>
        
        {/* SVG 半圓指針儀表板 */}
        <div className="relative w-full max-w-[240px] aspect-[2/1] mb-2">
          <svg viewBox="0 0 100 55" className="w-full h-full overflow-visible drop-shadow-sm">
            {/* 圓弧底色區段 (半徑35，圓周長約110) */}
            {/* 0-39: 安定 (Teal) */}
            <path d="M 15 50 A 35 35 0 0 1 85 50" fill="none" stroke="#14b8a6" strokeWidth="6" strokeLinecap="round" strokeDasharray="44 110" />
            {/* 40-59: 適度關注 (Amber) */}
            <path d="M 15 50 A 35 35 0 0 1 85 50" fill="none" stroke="#f59e0b" strokeWidth="6" strokeDasharray="22 110" strokeDashoffset="-44" />
            {/* 60-79: 局勢波動 (Orange) */}
            <path d="M 15 50 A 35 35 0 0 1 85 50" fill="none" stroke="#f97316" strokeWidth="6" strokeDasharray="22 110" strokeDashoffset="-66" />
            {/* 80-100: 密切關注 (Rose) */}
            <path d="M 15 50 A 35 35 0 0 1 85 50" fill="none" stroke="#f43f5e" strokeWidth="6" strokeLinecap="round" strokeDasharray="22 110" strokeDashoffset="-88" />
            
            {/* 動態指針 (Pivot at 50,50) */}
            <g style={{ transform: `rotate(${(score / 100) * 180}deg)`, transformOrigin: '50px 50px', transition: 'transform 1s cubic-bezier(0.4, 0, 0.2, 1)' }}>
              {/* 指針本體 (指向左邊 0 分的位置) */}
              <polygon points="50,48 18,50 50,52" fill="#475569" />
              {/* 指針尾部裝飾 */}
              <polygon points="50,48 56,50 50,52" fill="#94a3b8" />
            </g>
            {/* 軸心圓點 */}
            <circle cx="50" cy="50" r="3.5" fill="#334155" />
            <circle cx="50" cy="50" r="1.5" fill="#ffffff" />
          </svg>
          
          {/* 指數數字顯示在半圓內部 */}
          <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center justify-end pb-1">
            <span className={`text-4xl font-extrabold tracking-tighter ${theme.color}`}>
              {score}
            </span>
          </div>
        </div>

        {/* 柔和的狀態標籤 */}
        <div className={`mt-4 px-5 py-1.5 rounded-full text-sm font-bold tracking-wide border ${theme.bg} ${theme.color} ${theme.border}`}>
          {theme.label}
        </div>
      </section>

      {/* 3. 四大指標狀態卡片 (柔化版設計) */}
      <section className="grid grid-cols-2 gap-3.5">
        <div className="bg-white p-4 rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-slate-100/60">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-slate-50 text-slate-500 rounded-lg"><Crosshair size={16} /></div>
            <h3 className="font-semibold text-slate-600 text-xs">軍事動態</h3>
          </div>
          <p className="text-xl font-bold text-slate-800">{mockData.military.aircraftSorties} <span className="text-xs font-normal text-slate-400">架次</span></p>
          <p className="text-[11px] text-slate-500 mt-1">越線 {mockData.military.crossedMedianLine} 架次</p>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-slate-100/60">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-slate-50 text-slate-500 rounded-lg"><Globe size={16} /></div>
            <h3 className="font-semibold text-slate-600 text-xs">外交撤僑</h3>
          </div>
          <p className="text-xl font-bold text-slate-800">{mockData.diplomacy.travelWarningCount} <span className="text-xs font-normal text-slate-400">國</span></p>
          <p className="text-[11px] text-slate-500 mt-1">提升旅遊警示</p>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-slate-100/60">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-slate-50 text-slate-500 rounded-lg"><TrendingDown size={16} /></div>
            <h3 className="font-semibold text-slate-600 text-xs">金融異動</h3>
          </div>
          <p className="text-xl font-bold text-slate-800">-{mockData.finance.taiexDropPercent}%</p>
          <p className="text-[11px] text-slate-500 mt-1">台股大盤波動</p>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-slate-100/60">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-slate-50 text-slate-500 rounded-lg"><Newspaper size={16} /></div>
            <h3 className="font-semibold text-slate-600 text-xs">新聞情緒</h3>
          </div>
          <p className="text-xl font-bold text-slate-800">{mockData.news.sensitiveKeywordCount} <span className="text-xs font-normal text-slate-400">則</span></p>
          <p className="text-[11px] text-slate-500 mt-1">敏感情緒指標</p>
        </div>
      </section>

      {/* 4. 最新關鍵動態 (更為安定的提示框) */}
      <section className="bg-teal-50/50 border border-teal-100 rounded-2xl p-4 flex gap-3 items-start shadow-sm">
        <ShieldCheck className="text-teal-600 shrink-0 mt-0.5" size={18} />
        <div>
          <h4 className="text-sm font-bold text-teal-800 mb-1">系統提示</h4>
          <p className="text-xs text-teal-700/80 leading-relaxed">
            目前指標呈現穩健狀態。建議可利用閒暇時間至「準備」分頁查看急難救助包清單，保持從容不迫的防備心。
          </p>
        </div>
      </section>
    </div>
  );
}
