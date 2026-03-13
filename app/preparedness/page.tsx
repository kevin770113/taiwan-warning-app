"use client";

import { useState, useEffect } from "react";
import { useScroll, useMotionValueEvent } from "framer-motion";
import { 
  CheckCircle2, Circle, FileText, Droplet, 
  BriefcaseMedical, Wrench, Shirt, AlertCircle,
  Backpack, ShieldAlert, Info
} from "lucide-react";

// --- 急難救助包清單資料 (維持不變) ---
const checklistData = [
  {
    categoryId: "docs",
    title: "重要證件與財務",
    icon: FileText,
    theme: { bg: "bg-blue-50/50", border: "border-blue-100/80", iconBg: "bg-blue-100/80", iconText: "text-blue-600" },
    items: [
      { id: "id_card", label: "身分證、健保卡、駕照 (正本或雙面影本)", isAdvanced: false },
      { id: "cash", label: "少量現金與零錢 (含百元鈔與硬幣)", isAdvanced: false },
      { id: "contacts", label: "紙本緊急聯絡人名冊與避難所地址", isAdvanced: false },
      { id: "property_docs", label: "存摺、地契、保單等重要財產證明影本 (放水袋密封)", isAdvanced: true },
      { id: "passport", label: "備用大頭照數張、護照正本", isAdvanced: true },
      { id: "spare_keys", label: "實體備用鑰匙 (住家、車輛)", isAdvanced: true },
    ]
  },
  {
    categoryId: "water_food",
    title: "飲食與飲水",
    icon: Droplet,
    theme: { bg: "bg-cyan-50/50", border: "border-cyan-100/80", iconBg: "bg-cyan-100/80", iconText: "text-cyan-600" },
    items: [
      { id: "water", label: "瓶裝水 (每人每天至少 3 公升)", isAdvanced: false },
      { id: "food", label: "高熱量且免加熱乾糧 (能量棒、巧克力)", isAdvanced: false },
      { id: "can_food", label: "易開罐罐頭、保久乳", isAdvanced: false },
      { id: "water_filter", label: "便攜式個人淨水吸管或淨水藥片", isAdvanced: true },
      { id: "stove", label: "卡式爐、備用瓦斯罐與簡易炊具", isAdvanced: true },
      { id: "mre", label: "脫水乾燥飯、軍用口糧 (MRE) 或真空包裝食品", isAdvanced: true },
      { id: "vitamins", label: "維他命發泡錠或綜合維他命", isAdvanced: true },
    ]
  },
  {
    categoryId: "medical",
    title: "醫療與個人衛生",
    icon: BriefcaseMedical,
    theme: { bg: "bg-emerald-50/50", border: "border-emerald-100/80", iconBg: "bg-emerald-100/80", iconText: "text-emerald-600" },
    items: [
      { id: "meds", label: "個人慢性病藥物 (至少備妥 14 天份)", isAdvanced: false },
      { id: "first_aid", label: "基礎急救包 (優碘、紗布、透氣膠帶、生理食鹽水)", isAdvanced: false },
      { id: "hygiene", label: "衛生紙、濕紙巾、女性生理用品", isAdvanced: false },
      { id: "mask", label: "醫療口罩、酒精噴霧", isAdvanced: false },
      { id: "trauma_kit", label: "進階外傷急救品 (止血帶、以色列繃帶、醫療剪刀)", isAdvanced: true },
      { id: "otc_meds", label: "常備非處方藥 (解熱鎮痛藥、止瀉藥、抗組織胺、胃藥)", isAdvanced: true },
      { id: "waste_bags", label: "簡易排泄處理袋 (斷水時馬桶無法使用)", isAdvanced: true },
      { id: "n95", label: "防塵護目鏡、N95 防護口罩", isAdvanced: true },
    ]
  },
  {
    categoryId: "tools",
    title: "工具與通訊",
    icon: Wrench,
    theme: { bg: "bg-amber-50/50", border: "border-amber-100/80", iconBg: "bg-amber-100/80", iconText: "text-amber-600" },
    items: [
      { id: "flashlight", label: "LED 手電筒與對應的備用電池", isAdvanced: false },
      { id: "powerbank", label: "大容量行動電源與充電線", isAdvanced: false },
      { id: "whistle", label: "高分貝求救哨子", isAdvanced: false },
      { id: "gloves", label: "粗棉工作手套 (搬開碎石或玻璃時保護雙手)", isAdvanced: false },
      { id: "multitool", label: "多功能工具鉗 (如瑞士刀或 Leatherman)", isAdvanced: true },
      { id: "radio", label: "手搖式發電收音機 (兼具手電筒與充電功能)", isAdvanced: true },
      { id: "solar", label: "便攜式太陽能充電板", isAdvanced: true },
      { id: "tape_cord", label: "大力膠帶 (Duct tape) 與 傘繩 (550 Paracord)", isAdvanced: true },
      { id: "map", label: "實體台灣公路地圖、指南針", isAdvanced: true },
    ]
  },
  {
    categoryId: "clothing",
    title: "衣物與保暖",
    icon: Shirt,
    theme: { bg: "bg-violet-50/50", border: "border-violet-100/80", iconBg: "bg-violet-100/80", iconText: "text-violet-600" },
    items: [
      { id: "blanket", label: "急難保暖毯 (鋁箔材質，防風防失溫)", isAdvanced: false },
      { id: "raincoat", label: "輕便雨衣 (防雨兼具基礎保暖)", isAdvanced: false },
      { id: "shoes", label: "耐磨好走的包鞋或登山鞋 (絕對不可穿拖鞋)", isAdvanced: false },
      { id: "clothes", label: "一套輕便換洗衣物與免洗內褲", isAdvanced: false },
      { id: "jacket", label: "防風防水外套 (Gore-Tex 或同等級材質)", isAdvanced: true },
      { id: "sleeping_bag", label: "輕量化羽絨睡袋", isAdvanced: true },
      { id: "beanie_socks", label: "保暖毛帽與羊毛襪", isAdvanced: true },
      { id: "headlamp", label: "免提式頭燈 (讓雙手能空出來做事)", isAdvanced: true },
    ]
  }
];

export default function PreparednessPage() {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [isMounted, setIsMounted] = useState(false);
  const [mode, setMode] = useState<"basic" | "proactive">("basic");
  
  // 決定何時顯示「頂層極簡 Header」
  const [showMiniHeader, setShowMiniHeader] = useState(false);

  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (latest) => {
    // 當往下滑動超過 200px (差不多是完整 Header 離開視線的時候)
    if (latest > 200 && !showMiniHeader) setShowMiniHeader(true);
    if (latest <= 200 && showMiniHeader) setShowMiniHeader(false);
  });

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem("emergency_kit_progress");
    if (saved) {
      try { setCheckedItems(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("emergency_kit_progress", JSON.stringify(checkedItems));
    }
  }, [checkedItems, isMounted]);

  const toggleItem = (id: string) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const currentItems = checklistData.flatMap(cat => 
    cat.items.filter(item => mode === "proactive" || !item.isAdvanced)
  );
  const totalItems = currentItems.length;
  const completedItems = currentItems.filter(item => checkedItems[item.id]).length;
  const progressPercent = totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100);

  if (!isMounted) return <div className="min-h-screen bg-[#f8fafc]"></div>;

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans pb-24 relative">
      
      {/* =========================================
          🔥 頂層：極簡版 Mini Header (完全固定，靠 GPU 淡入淡出)
          ========================================= */}
      <div 
        className={`fixed top-0 z-50 w-full max-w-md mx-auto transition-all duration-300 ease-out ${
          showMiniHeader ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
        }`}
      >
        <div className="bg-white/95 backdrop-blur-md shadow-sm pt-4 pb-0 px-5">
          {/* 迷你雙模式切換 */}
          <div className="flex bg-slate-100/80 p-1 rounded-xl shadow-inner mb-3">
            <button
              onClick={() => setMode("basic")}
              className={`flex-1 flex justify-center items-center gap-2 py-1.5 text-xs font-bold rounded-lg transition-all ${
                mode === "basic" ? "bg-white text-teal-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              基本
            </button>
            <button
              onClick={() => setMode("proactive")}
              className={`flex-1 flex justify-center items-center gap-2 py-1.5 text-xs font-bold rounded-lg transition-all ${
                mode === "proactive" ? "bg-white text-amber-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              積極
            </button>
          </div>

          {/* 迷你進度條 (黏在底部邊緣) */}
          <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-200">
            <div 
              className={`h-full transition-all duration-700 ease-out ${
                mode === "basic" ? "bg-teal-500" : "bg-amber-500"
              }`}
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* =========================================
          🌿 底層：完整版 Normal Header (自然滾動，不吸頂、不變形)
          ========================================= */}
      <div className="pt-6 px-5 mb-2">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">防災準備</h1>
        <p className="text-sm text-slate-500 mt-1 mb-4">急難救助包檢核表</p>

        {/* 說明框 */}
        <div className="flex items-start gap-2 bg-slate-50 border border-slate-100 p-3 rounded-xl shadow-sm mb-4">
          <Info size={16} className="text-slate-400 shrink-0 mt-0.5" />
          <p className="text-[13px] text-slate-600 leading-relaxed">
            {mode === "basic" 
              ? "目標：應對突發狀況，能於 3 分鐘內攜帶逃生的「避難逃生包 (Go-Bag)」，以維持 3 天基礎生存為原則。"
              : "目標：應對長期斷網斷電、封鎖或居家「就地掩蔽」，以維持 1~2 週生存與較高自救能力為原則。"}
          </p>
        </div>

        {/* 完整版雙模式切換 */}
        <div className="flex bg-slate-200/60 p-1 rounded-xl shadow-inner mb-4">
          <button
            onClick={() => setMode("basic")}
            className={`flex-1 flex justify-center items-center gap-2 py-2 text-sm font-bold rounded-lg transition-all ${
              mode === "basic" ? "bg-white text-teal-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Backpack size={16} /> 基本避難
          </button>
          <button
            onClick={() => setMode("proactive")}
            className={`flex-1 flex justify-center items-center gap-2 py-2 text-sm font-bold rounded-lg transition-all ${
              mode === "proactive" ? "bg-white text-amber-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <ShieldAlert size={16} /> 積極防備
          </button>
        </div>

        {/* 完整版進度條卡片 */}
        <div className="bg-white border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] p-4 rounded-2xl">
          <div className="flex justify-between items-end mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              {mode === "basic" ? "基本準備進度" : "積極準備進度"}
            </span>
            <span className={`text-xl font-black ${mode === "basic" ? "text-teal-600" : "text-amber-500"}`}>
              {progressPercent}%
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div 
              className={`h-2.5 rounded-full transition-all duration-700 ease-out ${
                mode === "basic" ? "bg-teal-500" : "bg-amber-500"
              }`}
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <div className="text-right mt-2">
            <p className="text-[11px] font-medium text-slate-400">
              已完成 {completedItems} / {totalItems} 項
            </p>
          </div>
        </div>
      </div>

      {/* =========================================
          📦 清單內容區域 (保持不變)
          ========================================= */}
      <main className="px-5 pt-3 pb-5 space-y-5">
        {checklistData.map((category) => {
          const CategoryIcon = category.icon;
          const visibleItems = category.items.filter(item => mode === "proactive" || !item.isAdvanced);
          if (visibleItems.length === 0) return null;

          return (
            <section key={category.categoryId} className={`rounded-3xl border overflow-hidden shadow-[0_2px_12px_rgb(0,0,0,0.02)] ${category.theme.bg} ${category.theme.border}`}>
              <div className="px-5 py-4 border-b border-white/40 flex items-center gap-3">
                <div className={`p-2 rounded-xl ${category.theme.iconBg} ${category.theme.iconText} shadow-sm`}>
                  <CategoryIcon size={18} />
                </div>
                <h2 className="font-bold text-slate-800 text-sm">{category.title}</h2>
              </div>
              <div className="px-3 py-2 pb-3">
                {visibleItems.map((item) => {
                  const isChecked = !!checkedItems[item.id];
                  return (
                    <div 
                      key={item.id} 
                      onClick={() => toggleItem(item.id)}
                      className="flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors hover:bg-white/60 active:bg-white/80"
                    >
                      <div className="mt-0.5 shrink-0 transition-colors duration-300">
                        {isChecked ? (
                          <CheckCircle2 size={22} className={`${category.theme.iconText} fill-white`} />
                        ) : (
                          <Circle size={22} className="text-slate-400/50" />
                        )}
                      </div>
                      <div className="flex flex-col gap-1 w-full">
                        <span className={`text-[13px] leading-relaxed transition-all duration-300 ${
                          isChecked ? "text-slate-400 line-through" : "text-slate-700 font-medium"
                        }`}>
                          {item.label}
                        </span>
                        {item.isAdvanced && mode === "proactive" && !isChecked && (
                          <span className="self-start text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded bg-white/60 text-amber-600/80 border border-amber-200/50">
                            進階裝備
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}
