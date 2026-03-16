"use client";

import { useState, useEffect } from "react";
import { Activity, MapPin, Clock, Radio, CheckCircle2, Loader2 } from "lucide-react";
import TaiwanCountyMap from "@/components/TaiwanCountyMap";
import { fetchLatestEarthquake, EarthquakeReport } from "@/lib/earthquakeData";

export default function EarthquakePage() {
  // 預設切換到「正式報告」
  const [reportStage, setReportStage] = useState<"EEW" | "FORMAL">("FORMAL");
  const [quakeData, setQuakeData] = useState<EarthquakeReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 頁面載入時，自動去抓取最新地震資料
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const data = await fetchLatestEarthquake();
      setQuakeData(data);
      setIsLoading(false);
    };
    loadData();
  }, []);

  // 全螢幕載入畫面 (骨架屏)
  if (isLoading || !quakeData) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center pb-20">
        <Loader2 className="animate-spin text-teal-500 mb-4" size={32} />
        <p className="text-sm font-bold text-slate-500 tracking-wider">連線中央氣象署中...</p>
      </div>
    );
  }

  const currentIntensities = reportStage === "FORMAL" ? quakeData.intensities : undefined;

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans pb-24">
      
      <header className="pt-6 px-5 pb-4 bg-white border-b border-slate-100 sticky top-0 z-20 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">地震資訊</h1>
        <p className="text-sm text-slate-500 mt-1">氣象署即時測報整合</p>
        
        {/* 全新設計：淺顯易懂的雙頁籤 (Tabs) 切換 */}
        <div className="flex bg-slate-100 p-1.5 rounded-xl mt-5">
          <button 
            onClick={() => setReportStage("EEW")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
              reportStage === "EEW" ? "bg-white text-amber-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Radio size={14} className={reportStage === "EEW" ? "animate-pulse" : ""} /> 
            即時速報 (推估)
          </button>
          <button 
            onClick={() => setReportStage("FORMAL")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
              reportStage === "FORMAL" ? "bg-white text-teal-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <CheckCircle2 size={14} /> 
            正式報告 (實測)
          </button>
        </div>
      </header>

      <main className="px-5 pt-5 space-y-5">
        
        <section className={`p-5 rounded-3xl border shadow-sm transition-all duration-500 ${
          reportStage === "EEW" ? "bg-amber-50 border-amber-200" : "bg-white border-slate-200"
        }`}>
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              {reportStage === "EEW" ? (
                <>
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
                    初步推估數據
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} className="text-teal-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    最新實測報告
                  </span>
                </>
              )}
            </div>
            <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
              <Clock size={12} /> {quakeData.time.split(" ")[1]}
            </span>
          </div>

          <div className="flex items-end gap-4 mb-4">
            <div>
              <p className="text-xs text-slate-500 font-bold mb-0.5">芮氏規模 (M)</p>
              <p className="text-5xl font-black tracking-tighter text-slate-800">
                {quakeData.magnitude.toFixed(1)}
              </p>
            </div>
            <div className="pb-1">
              <p className="text-xs text-slate-500 font-bold mb-0.5">深度</p>
              <p className="text-xl font-bold text-slate-700">{quakeData.depth} <span className="text-xs font-medium text-slate-500">km</span></p>
            </div>
          </div>

          <div className="flex items-start gap-2 bg-white/60 p-3 rounded-xl border border-black/5">
            <MapPin size={16} className="text-slate-500 shrink-0 mt-0.5" />
            <p className="text-[13px] font-medium text-slate-700 leading-snug">
              {quakeData.epicenter}
            </p>
          </div>
          
          {reportStage === "EEW" && (
            <p className="mt-3 text-[11px] text-amber-600 font-bold animate-pulse">
              * 系統自動解算中，精確災情請依正式報告為準。
            </p>
          )}
        </section>

        <section className="bg-white p-5 rounded-3xl shadow-[0_2px_12px_rgb(0,0,0,0.03)] border border-slate-100">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Activity size={16} className="text-teal-600" />
              各地最大震度
            </h2>
          </div>

          <div className="bg-slate-50/50 rounded-2xl border border-slate-100/50 mb-4 relative overflow-hidden">
            {/* 白話文說明遮罩 */}
            {reportStage === "EEW" && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[1.5px] z-10 flex flex-col items-center justify-center">
                <Radio size={24} className="text-slate-400 animate-bounce mb-2" />
                <span className="text-xs font-bold text-slate-600">氣象署數據統整中，請保持警戒...</span>
              </div>
            )}
            
            <TaiwanCountyMap 
              intensities={currentIntensities} 
              epicenterCoords={quakeData.epicenterCoords}
            />
          </div>

          <div className="bg-slate-50 px-3 py-3 rounded-xl border border-slate-100 flex flex-col gap-2">
            <span className="text-[10px] font-bold text-slate-400">氣象署 10 級震度色階</span>
            <div className="grid grid-cols-4 gap-2">
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#86efac]"></span><span className="text-[10px] font-medium text-slate-600">1-2</span></div>
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#fde047]"></span><span className="text-[10px] font-medium text-slate-600">3</span></div>
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#fb923c]"></span><span className="text-[10px] font-medium text-slate-600">4</span></div>
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#ef4444]"></span><span className="text-[10px] font-medium text-slate-600">5弱</span></div>
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#b91c1c]"></span><span className="text-[10px] font-medium text-slate-600">5強</span></div>
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#78350f]"></span><span className="text-[10px] font-medium text-slate-600">6弱</span></div>
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#6b21a8]"></span><span className="text-[10px] font-medium text-slate-600">6強</span></div>
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#1e1b4b]"></span><span className="text-[10px] font-medium text-slate-600">7</span></div>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
