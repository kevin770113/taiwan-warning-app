"use client";

import { useState } from "react";
import { Activity, MapPin, Clock, AlertTriangle, Radio, CheckCircle2 } from "lucide-react";
import TaiwanCountyMap from "@/components/TaiwanCountyMap";
import { mockFormalReport } from "@/lib/earthquakeData";

export default function EarthquakePage() {
  // 控制狀態：目前是「EEW 速報期」還是「正式報告期」
  const [reportStage, setReportStage] = useState<"EEW" | "FORMAL">("EEW");

  // 如果是 EEW 期，我們不傳入 intensities，地圖會保持全灰
  const currentIntensities = reportStage === "FORMAL" ? mockFormalReport.intensities : undefined;

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans pb-24">
      
      <header className="pt-6 px-5 pb-4 bg-white border-b border-slate-100 sticky top-0 z-20 shadow-sm flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">地震資訊</h1>
          <p className="text-sm text-slate-500 mt-1">氣象署即時測報整合</p>
        </div>
        
        {/* 測試用切換按鈕 (模擬時間推移) */}
        <button 
          onClick={() => setReportStage(prev => prev === "EEW" ? "FORMAL" : "EEW")}
          className="bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
        >
          切換狀態: {reportStage}
        </button>
      </header>

      <main className="px-5 pt-5 space-y-5">
        
        {/* 1. 動態資訊卡片 (依據報告階段改變樣式) */}
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
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1">
                    <Radio size={14} /> EEW 電腦速報
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} className="text-teal-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    CWA 正式報告
                  </span>
                </>
              )}
            </div>
            <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
              <Clock size={12} /> {mockFormalReport.time.split(" ")[1]}
            </span>
          </div>

          <div className="flex items-end gap-4 mb-4">
            <div>
              <p className="text-xs text-slate-500 font-bold mb-0.5">初步規模 (M)</p>
              <p className="text-5xl font-black tracking-tighter text-slate-800">
                {mockFormalReport.magnitude.toFixed(1)}
              </p>
            </div>
            <div className="pb-1">
              <p className="text-xs text-slate-500 font-bold mb-0.5">深度</p>
              <p className="text-xl font-bold text-slate-700">{mockFormalReport.depth} <span className="text-xs font-medium text-slate-500">km</span></p>
            </div>
          </div>

          <div className="flex items-start gap-2 bg-white/60 p-3 rounded-xl border border-black/5">
            <MapPin size={16} className="text-slate-500 shrink-0 mt-0.5" />
            <p className="text-[13px] font-medium text-slate-700 leading-snug">
              {mockFormalReport.epicenter}
            </p>
          </div>
          
          {/* EEW 專屬警語 */}
          {reportStage === "EEW" && (
            <p className="mt-3 text-[11px] text-amber-600 font-bold animate-pulse">
              * 電腦初步運算結果，各地實際震度彙整中，請保持警戒。
            </p>
          )}
        </section>

        {/* 2. 縣市震度面量圖 (Choropleth Map) */}
        <section className="bg-white p-5 rounded-3xl shadow-[0_2px_12px_rgb(0,0,0,0.03)] border border-slate-100">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Activity size={16} className="text-teal-600" />
              各地最大震度
            </h2>
          </div>

          {/* 地圖元件 */}
          <div className="bg-slate-50/50 rounded-2xl border border-slate-100/50 mb-4 relative overflow-hidden">
             {/* 如果是 EEW，蓋上一層半透明遮罩 */}
             {reportStage === "EEW" && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center">
                <Radio size={24} className="text-slate-400 animate-bounce mb-2" />
                <span className="text-xs font-bold text-slate-500">等待各地測站數據回傳...</span>
              </div>
            )}
            <TaiwanCountyMap intensities={currentIntensities} />
          </div>

          {/* 3. 官方 CWA 10 級色階圖例 (正確版) */}
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
