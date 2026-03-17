// 檔案：app/intelligence/page.tsx
"use client";

import { useState } from "react";
import { Clock, Crosshair, Globe, TrendingDown, Newspaper, ExternalLink, ShieldAlert, RefreshCw, Info } from "lucide-react";
import { useIntelligence } from "@/lib/useIntelligence";

export default function IntelligencePage() {
  const [activeTab, setActiveTab] = useState<"military" | "diplomacy" | "finance" | "news">("military");
  const { data, lastUpdated, isFetching, refetch } = useIntelligence();

  const tabs = [
    { id: "military", icon: Crosshair, label: "軍事" },
    { id: "diplomacy", icon: Globe, label: "外交" },
    { id: "finance", icon: TrendingDown, label: "金融" },
    { id: "news", icon: Newspaper, label: "新聞" },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans pb-24 flex flex-col">
      <header className="pt-6 px-5 pb-4 bg-white border-b border-slate-100">
        <div className="flex justify-between items-end mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">情報與預警中心</h1>
            <p className="text-sm text-slate-500 mt-1">即時動態追蹤</p>
          </div>
          <button 
            onClick={refetch}
            disabled={isFetching}
            className="flex items-center text-xs text-slate-500 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-full shadow-sm hover:bg-slate-100 active:scale-95 transition-all"
          >
            <RefreshCw size={12} className={`mr-1.5 ${isFetching ? "animate-spin text-teal-500" : ""}`} />
            <span>{isFetching ? "更新中..." : `更新於 ${lastUpdated}`}</span>
          </button>
        </div>

        <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center whitespace-nowrap px-4 py-2 rounded-2xl text-sm font-semibold transition-colors shadow-sm border ${
                  isActive 
                    ? "bg-teal-50 border-teal-200 text-teal-700" 
                    : "bg-white border-slate-100 text-slate-500 hover:bg-slate-50"
                }`}
              >
                <Icon size={16} className={`mr-2 ${isActive ? "text-teal-600" : "text-slate-400"}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      <main className="p-5 flex-1 flex flex-col">
        {isFetching && !data && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <RefreshCw size={32} className="animate-spin mb-4 text-slate-300" />
            <p className="text-sm">正在載入最新情報...</p>
          </div>
        )}

        {data && (
          <div className="flex-1">
            {activeTab === "military" && (
              <div className="relative border-l-2 border-slate-200 ml-3 space-y-6 pb-4">
                {data.military.map((item) => (
                  <div key={item.id} className="relative pl-6">
                    <span className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-rose-100 border-2 border-white flex items-center justify-center">
                      <span className="h-2 w-2 rounded-full bg-rose-400"></span>
                    </span>
                    <div className="text-xs font-bold text-slate-400 mb-1.5">{item.date}</div>
                    <div className="bg-white p-4 rounded-2xl shadow-[0_2px_8px_rgb(0,0,0,0.02)] border border-slate-100/80">
                      <h3 className="font-bold text-slate-800 text-sm mb-2">{item.title}</h3>
                      <div className="flex gap-3 mb-3">
                        <span className="bg-slate-50 text-slate-600 text-xs px-2 py-1 rounded font-medium border border-slate-100">總共 {item.sorties} 架次</span>
                        <span className="bg-rose-50 text-rose-600 text-xs px-2 py-1 rounded font-medium border border-rose-100">越線 {item.crossed} 架次</span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "diplomacy" && (
              <div className="space-y-3">
                {data.diplomacy.map((item) => (
                  <div key={item.id} className="bg-white p-4 rounded-2xl shadow-[0_2px_8px_rgb(0,0,0,0.02)] border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl drop-shadow-sm">{item.flag}</span>
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm">{item.country}</h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">{item.time} 更新</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                        item.level === "normal" ? "bg-slate-50 text-slate-500 border-slate-200" :
                        item.level === "notice" ? "bg-amber-50 text-amber-600 border-amber-200" :
                        "bg-orange-50 text-orange-600 border-orange-200"
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "finance" && (
              <div className="space-y-3">
                {data.finance.map((item) => (
                  <div key={item.id} className="bg-white p-4 rounded-2xl shadow-[0_2px_8px_rgb(0,0,0,0.02)] border border-slate-100 flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-slate-600 text-xs mb-1">{item.name}</h3>
                      <p className="text-2xl font-black text-slate-800">{item.value}</p>
                    </div>
                    <div className={`text-right flex flex-col items-end ${item.isDown ? "text-rose-500" : "text-emerald-500"}`}>
                      <span className="text-sm font-bold bg-slate-50 px-2 py-0.5 rounded flex items-center gap-1">
                        {item.isDown ? <TrendingDown size={14} /> : <TrendingDown size={14} className="rotate-180" />}
                        {item.percent}
                      </span>
                      <span className="text-xs font-medium mt-1 opacity-80">{item.change}</span>
                    </div>
                  </div>
                ))}
                <div className="mt-4 bg-sky-50/50 border border-sky-100 p-3 rounded-xl flex gap-2 items-start">
                  <ShieldAlert size={16} className="text-sky-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-sky-800/80 leading-relaxed">
                    金融數據受全球市場影響波動較大，本系統重點監測異常的大規模拋售或匯出行為，作為輔助參考。
                  </p>
                </div>
              </div>
            )}

            {activeTab === "news" && (
              <div className="space-y-4">
                {data.news.map((item) => (
                  <div key={item.id} className="bg-white p-4 rounded-2xl shadow-[0_2px_8px_rgb(0,0,0,0.02)] border border-slate-100">
                    <div className="flex justify-between items-center mb-2">
                      <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">{item.source}</span>
                      <span className="text-[10px] text-slate-400 font-medium">{item.time}</span>
                    </div>
                    <h3 className="font-bold text-slate-800 text-sm leading-snug mb-1.5">{item.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{item.snippet}</p>
                    {item.url && (
                      <div className="mt-3 flex justify-end">
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-[11px] font-bold text-teal-600 flex items-center hover:text-teal-700">
                          閱讀原文 <ExternalLink size={12} className="ml-1" />
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 🌟 查證來源宣告區塊 (Data Source Footer) */}
        <div className="mt-8 pt-4 border-t border-slate-200/60 flex items-center justify-center gap-1.5 text-slate-400">
          <Info size={13} />
          <p className="text-[11px] font-medium tracking-wide">
            {activeTab === "military" && "資料來源：中華民國國防部 / 中央通訊社"}
            {activeTab === "diplomacy" && "資料來源：外交部領事事務局 Open Data"}
            {activeTab === "finance" && "資料來源：台灣證券交易所 / RTER 全球即時匯率 API"}
            {activeTab === "news" && "資料來源：GNews 即時新聞 / 全球通訊社"}
          </p>
        </div>
      </main>
    </div>
  );
}
