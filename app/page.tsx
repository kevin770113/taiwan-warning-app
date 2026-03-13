import { calculateTension, getTensionStatus, type TensionData } from "@/lib/calculateTension";
import { Clock, Crosshair, Globe, TrendingDown, Newspaper, ShieldCheck } from "lucide-react";

export default function Home() {
  // 模擬數據
  const mockData: TensionData = {
    military: { aircraftSorties: 15, crossedMedianLine: 4, liveFireDrill: false },
    diplomacy: { travelWarningCount: 1, evacuationNotice: false },
    finance: { taiexDropPercent: 1.2, usdToTwdVolatility: 0.3, rmbToTwdVolatility: 0.1 },
    news: { sensitiveKeywordCount: 12 },
  };

  const score = calculateTension(mockData);
  const rawStatus = getTensionStatus(score);

  // UX 柔化處理與顏色對應
  const softUITheme = {
    "最高警戒": { label: "需密切關注", color: "text-rose-500", bg: "bg-rose-50", border: "border-rose-200" },
    "高度警戒": { label: "局勢波動", color: "text-orange-500", bg: "bg-orange-50", border: "border-orange-200" },
    "加強戒備": { label: "適度關注", color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-200" },
    "狀況平常": { label: "局勢安定", color: "text-teal-600", bg: "bg-teal-50", border: "border-teal-200" },
  };
  const theme = softUITheme[rawStatus.label as keyof typeof softUITheme] || softUITheme["狀況平常"];

  return (
    <div className="min-h-screen bg-[#f8fafc] pt-6 px-5 pb-24 flex flex-col gap-5 font-sans">
      {/* 1. 頂部狀態區 (Header) */}
      <header className="flex justify-between items-end mb-1">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">台海動態總覽</h1>
          <p className="text-sm text-slate-500 mt-1">客觀數據 • 安定守護</p>
        </div>
        <div className="flex items-center text-xs text-slate-400 bg-white border border-slate-100 px-3 py-1.5 rounded-full shadow-sm">
          <Clock size={14} className="mr-1.5" />
          <span>10 分鐘前</span>
        </div>
      </header>

      {/* 2. 核心半圓形儀表板 (放大版 + 分離文字) */}
      <section className="w-full bg-white rounded-3xl pt-6 pb-8 px-6 shadow-[0_4px_20px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col items-center">
        <h2 className="text-[13px] font-semibold text-slate-400 mb-6 tracking-widest uppercase">整體局勢指標</h2>
        
        {/* 放大的 SVG 半圓指針儀表板 */}
        <div className="relative w-full max-w-[280px]">
          {/* viewBox 增加底部空間 (0 0 100 55)，半徑加大為 40 */}
          <svg viewBox="0 0 100 55" className="w-full h-auto drop-shadow-sm overflow-visible">
            {/* 圓弧底色區段 (半徑40，圓周長約126) */}
            {/* 0-39: 安定 (Teal) */}
            <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#14b8a6" strokeWidth="8" strokeLinecap="round" strokeDasharray="50 126" />
            {/* 40-59: 適度關注 (Amber) */}
            <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#f59e0b" strokeWidth="8" strokeDasharray="25 126" strokeDashoffset="-50" />
            {/* 60-79: 局勢波動 (Orange) */}
            <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#f97316" strokeWidth="8" strokeDasharray="25 126" strokeDashoffset="-75" />
            {/* 80-100: 密切關注 (Rose) */}
            <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#f43f5e" strokeWidth="8" strokeLinecap="round" strokeDasharray="26 126" strokeDashoffset="-100" />
            
            {/* 動態指針 (Pivot at 50,50) */}
            <g style={{ transform: `rotate(${(score / 100) * 180}deg)`, transformOrigin: '50px 50px', transition: 'transform 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
              {/* 指針本體 (長度35，指向左) */}
              <polygon points="50,47 15,50 50,53" fill="#64748b" />
              <circle cx="50" cy="50" r="4.5" fill="#334155" />
              <circle cx="50" cy="50" r="2" fill="#ffffff" />
            </g>
          </svg>
        </div>

        {/* 分數與狀態獨立顯示於指針下方，徹底解決重疊問題 */}
        <div className="flex flex-col items-center mt-2">
          <span className={`text-6xl font-black tracking-tighter ${theme.color} drop-shadow-sm`}>
            {score}
          </span>
          <div className={`mt-3 px-5 py-1.5 rounded-full text-sm font-bold tracking-wide border ${theme.bg} ${theme.color} ${theme.border}`}>
            {theme.label}
          </div>
        </div>
      </section>

      {/* 3. 四大指標狀態卡片 (加入低調淡色背景) */}
      <section className="grid grid-cols-2 gap-3.5 mt-1">
        {/* 軍事 - 極淡玫瑰紅 */}
        <div className="bg-rose-50/40 p-4 rounded-2xl shadow-[0_2px_8px_rgb(0,0,0,0.02)] border border-rose-100/60">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-rose-100/80 text-rose-600 rounded-lg"><Crosshair size={16} /></div>
            <h3 className="font-semibold text-rose-900/70 text-xs">軍事動態</h3>
          </div>
          <p className="text-xl font-bold text-slate-800">{mockData.military.aircraftSorties} <span className="text-xs font-normal text-slate-500">架次</span></p>
          <p className="text-[11px] text-slate-500 mt-1">越線 {mockData.military.crossedMedianLine} 架次</p>
        </div>

        {/* 外交 - 極淡知更鳥藍 */}
        <div className="bg-sky-50/40 p-4 rounded-2xl shadow-[0_2px_8px_rgb(0,0,0,0.02)] border border-sky-100/60">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-sky-100/80 text-sky-600 rounded-lg"><Globe size={16} /></div>
            <h3 className="font-semibold text-sky-900/70 text-xs">外交撤僑</h3>
          </div>
          <p className="text-xl font-bold text-slate-800">{mockData.diplomacy.travelWarningCount} <span className="text-xs font-normal text-slate-500">國</span></p>
          <p className="text-[11px] text-slate-500 mt-1">提升旅遊警示</p>
        </div>

        {/* 金融 - 極淡薄荷綠 */}
        <div className="bg-emerald-50/40 p-4 rounded-2xl shadow-[0_2px_8px_rgb(0,0,0,0.02)] border border-emerald-100/60">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-emerald-100/80 text-emerald-600 rounded-lg"><TrendingDown size={16} /></div>
            <h3 className="font-semibold text-emerald-900/70 text-xs">金融異動</h3>
          </div>
          <p className="text-xl font-bold text-slate-800">-{mockData.finance.taiexDropPercent}%</p>
          <p className="text-[11px] text-slate-500 mt-1">台股大盤波動</p>
        </div>

        {/* 新聞 - 極淡薰衣草紫 */}
        <div className="bg-violet-50/40 p-4 rounded-2xl shadow-[0_2px_8px_rgb(0,0,0,0.02)] border border-violet-100/60">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-violet-100/80 text-violet-600 rounded-lg"><Newspaper size={16} /></div>
            <h3 className="font-semibold text-violet-900/70 text-xs">新聞情緒</h3>
          </div>
          <p className="text-xl font-bold text-slate-800">{mockData.news.sensitiveKeywordCount} <span className="text-xs font-normal text-slate-500">則</span></p>
          <p className="text-[11px] text-slate-500 mt-1">敏感情緒指標</p>
        </div>
      </section>

      {/* 4. 最新關鍵動態 */}
      <section className="bg-teal-50/60 border border-teal-100 rounded-2xl p-4 flex gap-3 items-start shadow-sm mt-1">
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
