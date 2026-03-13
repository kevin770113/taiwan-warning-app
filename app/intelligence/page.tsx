"use client";

import { useState } from "react";
import { Clock, Crosshair, Globe, TrendingDown, Newspaper, ExternalLink, AlertTriangle, ShieldAlert } from "lucide-react";

export default function IntelligencePage() {
  const [activeTab, setActiveTab] = useState<"military" | "diplomacy" | "finance" | "news">("military");

  // --- 模擬資料區 ---
  const mockMilitary = [
    { id: 1, date: "今日 14:00", title: "國防部發布即時軍事動態", sorties: 15, crossed: 4, isDrill: false, desc: "偵獲共機 15 架次、共艦 4 艘次持續在臺海周邊活動。其中 4 架次逾越海峽中線及其延伸線。" },
    { id: 2, date: "昨日 09:30", title: "東部海域聯合戰備警巡", sorties: 22, crossed: 10, isDrill: false, desc: "配合共艦執行聯合戰備警巡，國軍運用聯合情監偵手段嚴密掌握。" },
  ];

  const mockDiplomacy = [
    { id: 1, country: "美國", flag: "🇺🇸", status: "Level 3: Reconsider Travel", level: "warning", time: "2 小時前" },
    { id: 2, country: "日本", flag: "🇯🇵", status: "維持正常", level: "normal", time: "1 天前" },
    { id: 3, country: "英國", flag: "🇬🇧", status: "維持正常", level: "normal", time: "3 天前" },
    { id: 4, country: "澳洲", flag: "🇦🇺", status: "Level 2: Exercise High Degree of Caution", level: "notice", time: "5 小時前" },
  ];

  const mockFinance = [
    { id: 1, name: "台股加權指數 (TAIEX)", value: "20,123.45", change: "-254.12", percent: "-1.25%", isDown: true },
    { id: 2, name: "美元 / 台幣 (USD/TWD)", value: "32.450", change: "+0.120", percent: "+0.37%", isDown: false },
    { id: 3, name: "人民幣 / 台幣 (CNY/TWD)", value: "4.482", change: "+0.015", percent: "+0.33%", isDown: false },
  ];

  const mockNews = [
    { id: 1, source: "Reuters", time: "30 分鐘前", title: "U.S. closely monitoring Taiwan Strait activities amid recent drills", snippet: "Washington reiterates calls for peaceful resolution and stability in the region..." },
    { id: 2, source: "國內綜合報導", time: "2 小時前", title: "外資單日大幅賣超台股 300 億，匯市呈現震盪", snippet: "金融圈人士指出，近期地緣政治風險微幅上升，導致避險資金短期流出..." },
    { id: 3, source: "Bloomberg", time: "5 小時前", title: "Supply chain resilience in focus as tech giants review Asia operations", snippet: "Major semiconductor clients are seeking secondary hubs..." },
  ];

  // --- UI 元件區 ---
  const tabs = [
    { id: "military", icon: Crosshair, label: "軍事" },
    { id: "diplomacy", icon: Globe, label: "外交" },
    { id: "finance", icon: TrendingDown, label: "金融" },
    { id: "news", icon: Newspaper, label: "新聞" },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans pb-24">
      {/* 頂部 Header */}
      <header className="pt-6 px-5 pb-4 bg-white border-b border-slate-100">
        <div className="flex justify-between items-end mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">情報與預警中心</h1>
            <p className="text-sm text-slate-500 mt-1">即時動態追蹤</p>
          </div>
          <div className="flex items-center text-xs text-slate-400 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-full shadow-sm">
            <Clock size={14} className="mr-1.5" />
            <span>最新資訊</span>
          </div>
        </div>

        {/* 橫向滾動分類 Tab (Sticky 吸頂設計) */}
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

      {/* 內容區域 */}
      <main className="p-5">
        
        {/* ⚔️ 軍事動態 (時間軸排版) */}
        {activeTab === "military" && (
          <div className="relative border-l-2 border-slate-200 ml-3 space-y-6 pb-4">
            {mockMilitary.map((item) => (
              <div key={item.id} className="relative pl-6">
                {/* 時間軸圓點 */}
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

        {/* 🤝 外交撤僑 (國旗與警示列表) */}
        {activeTab === "diplomacy" && (
          <div className="space-y-3">
            {mockDiplomacy.map((item) => (
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

        {/* 💰 金融異動 (數據指標卡) */}
        {activeTab === "finance" && (
          <div className="space-y-3">
            {mockFinance.map((item) => (
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

        {/* 📰 新聞情緒 (簡潔新聞卡片) */}
        {activeTab === "news" && (
          <div className="space-y-4">
            {mockNews.map((item) => (
              <div key={item.id} className="bg-white p-4 rounded-2xl shadow-[0_2px_8px_rgb(0,0,0,0.02)] border border-slate-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">{item.source}</span>
                  <span className="text-[10px] text-slate-400 font-medium">{item.time}</span>
                </div>
                <h3 className="font-bold text-slate-800 text-sm leading-snug mb-1.5">{item.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{item.snippet}</p>
                <div className="mt-3 flex justify-end">
                  <button className="text-[11px] font-bold text-teal-600 flex items-center hover:text-teal-700">
                    閱讀摘要 <ExternalLink size={12} className="ml-1" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}
