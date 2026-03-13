"use client";

import { useState } from "react";
import { Activity, MapPin, Clock, AlertTriangle, Info, History } from "lucide-react";
import EarthquakeMap from "@/components/EarthquakeMap"; // 引入我們剛剛做的地圖組件

// --- 模擬地震資料庫 (未來會由後端 API 取代) ---
const mockEarthquakes = [
  {
    id: "eq-001",
    time: "2026-03-13 18:42:15",
    location: "花蓮縣政府南南東方 25.4 公里 (位於臺灣東部海域)",
    epicenter: { lng: 121.65, lat: 23.85 },
    magnitude: 6.2,
    depth: 15.5,
    isMajor: true,
  },
  {
    id: "eq-002",
    time: "2026-03-13 14:12:05",
    location: "宜蘭縣政府南南東方 38.4 公里 (位於臺灣東部海域)",
    epicenter: { lng: 121.85, lat: 24.45 },
    magnitude: 4.8,
    depth: 22.0,
    isMajor: false,
  },
  {
    id: "eq-003",
    time: "2026-03-12 09:30:22",
    location: "嘉義縣政府東南東方 18.2 公里 (位於嘉義縣中埔鄉)",
    epicenter: { lng: 120.45, lat: 23.35 },
    magnitude: 3.9,
    depth: 8.5,
    isMajor: false,
  },
  {
    id: "eq-004",
    time: "2026-03-10 22:15:40",
    location: "花蓮縣政府西南西方 15.2 公里 (位於花蓮縣壽豐鄉)",
    epicenter: { lng: 121.5, lat: 23.9 },
    magnitude: 5.1,
    depth: 12.0,
    isMajor: true,
  }
];

export default function EarthquakePage() {
  // 狀態：目前選中要顯示在地圖上的地震 (預設為最新的一筆)
  const [selectedQuake, setSelectedQuake] = useState(mockEarthquakes[0]);

  // 動態視覺主題：依據規模大小決定卡片顏色
  const getTheme = (mag: number) => {
    if (mag >= 5.5) return { bg: "bg-rose-50", text: "text-rose-600", border: "border-rose-200", badge: "bg-rose-500", ring: "ring-rose-500/20" };
    if (mag >= 4.5) return { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200", badge: "bg-amber-500", ring: "ring-amber-500/20" };
    return { bg: "bg-teal-50", text: "text-teal-600", border: "border-teal-200", badge: "bg-teal-500", ring: "ring-teal-500/20" };
  };

  const currentTheme = getTheme(selectedQuake.magnitude);

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans pb-24">
      
      {/* 頂部 Header */}
      <header className="pt-6 px-5 pb-4 bg-white border-b border-slate-100 sticky top-0 z-20 shadow-sm">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">地震資訊</h1>
            <p className="text-sm text-slate-500 mt-1">即時測報與震度熱力圖</p>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full shadow-sm">
            <Activity size={12} className="text-slate-400" />
            <span className="text-[10px] font-bold text-slate-500 tracking-wide">系統連線中</span>
          </div>
        </div>
      </header>

      <main className="px-5 pt-5 space-y-5">
        
        {/* 1. 最新/選中地震資訊卡 (Hero Card) */}
        <section className={`p-5 rounded-3xl border shadow-sm transition-colors duration-500 ${currentTheme.bg} ${currentTheme.border}`}>
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              <span className={`flex h-3 w-3 relative`}>
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${currentTheme.badge}`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${currentTheme.badge}`}></span>
              </span>
              <span className={`text-xs font-bold uppercase tracking-wider ${currentTheme.text}`}>
                {selectedQuake.id === mockEarthquakes[0].id ? "最新測報" : "歷史紀錄"}
              </span>
            </div>
            <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
              <Clock size={12} /> {selectedQuake.time.split(" ")[1]}
            </span>
          </div>

          <div className="flex items-end gap-4 mb-4">
            <div>
              <p className="text-xs text-slate-500 font-bold mb-0.5">芮氏規模 (M)</p>
              <p className={`text-5xl font-black tracking-tighter ${currentTheme.text}`}>
                {selectedQuake.magnitude.toFixed(1)}
              </p>
            </div>
            <div className="pb-1">
              <p className="text-xs text-slate-500 font-bold mb-0.5">深度</p>
              <p className="text-xl font-bold text-slate-700">{selectedQuake.depth} <span className="text-xs font-medium text-slate-500">km</span></p>
            </div>
          </div>

          <div className="flex items-start gap-2 bg-white/60 p-3 rounded-xl border border-white/50">
            <MapPin size={16} className={`${currentTheme.text} shrink-0 mt-0.5`} />
            <p className="text-[13px] font-medium text-slate-700 leading-snug">
              {selectedQuake.location}
            </p>
          </div>
        </section>

        {/* 2. 核心：動態地形熱力圖 (Map Section) */}
        <section className="bg-white p-5 rounded-3xl shadow-[0_2px_12px_rgb(0,0,0,0.03)] border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Activity size={16} className="text-teal-600" />
              震波擴散推估圖
            </h2>
            <button className="text-[10px] text-slate-400 flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
              <Info size={12} /> 電腦自動運算
            </button>
          </div>

          {/* 渲染我們自訂的 Canvas 熱力圖 */}
          <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100/50 mb-4">
            <EarthquakeMap 
              epicenter={selectedQuake.epicenter} 
              magnitude={selectedQuake.magnitude} 
            />
          </div>

          {/* 震度色階圖例 (Legend) */}
          <div className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400">震度色階</span>
            <div className="flex gap-1.5">
              <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-teal-400 opacity-80"></span><span className="text-[9px] text-slate-500">1-2</span></div>
              <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-yellow-400 opacity-80"></span><span className="text-[9px] text-slate-500">3</span></div>
              <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-orange-400 opacity-80"></span><span className="text-[9px] text-slate-500">4</span></div>
              <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-rose-500 opacity-80"></span><span className="text-[9px] text-slate-500">5+</span></div>
            </div>
          </div>
        </section>

        {/* 3. 近期地震紀錄 (History List) */}
        <section>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5 ml-1">
            <History size={14} /> 近期顯著地震
          </h3>
          <div className="space-y-3">
            {mockEarthquakes.map((quake) => {
              const isSelected = selectedQuake.id === quake.id;
              const theme = getTheme(quake.magnitude);
              
              return (
                <div 
                  key={quake.id}
                  onClick={() => setSelectedQuake(quake)}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all duration-300 flex items-center justify-between ${
                    isSelected 
                      ? `bg-white shadow-md ${theme.border} ring-2 ${theme.ring}` 
                      : "bg-white shadow-[0_2px_8px_rgb(0,0,0,0.02)] border-slate-100 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3 w-full overflow-hidden">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                      isSelected ? `${theme.badge} text-white` : "bg-slate-100 text-slate-600"
                    }`}>
                      {quake.magnitude.toFixed(1)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`font-bold text-[13px] truncate ${isSelected ? "text-slate-800" : "text-slate-600"}`}>
                        {quake.location.split("(")[0]}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{quake.time.split(" ")[0]} {quake.time.split(" ")[1]}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 底部免責聲明 */}
        <div className="bg-slate-100/50 border border-slate-200 p-4 rounded-2xl flex gap-3 mt-4 mb-2">
          <AlertTriangle className="text-slate-400 shrink-0 mt-0.5" size={16} />
          <p className="text-[11px] text-slate-500 leading-relaxed">
            此頁面顯示之震度熱力圖為電腦依據震央與規模進行之物理衰減與場址效應推估，並非實際觀測值。精確災情請以中央氣象署發布之正式報告為準。
          </p>
        </div>

      </main>
    </div>
  );
}
