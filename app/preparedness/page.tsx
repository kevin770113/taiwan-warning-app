"use client";

import { useState, useEffect } from "react";
import { 
  CheckCircle2, Circle, FileText, Droplet, 
  BriefcaseMedical, Wrench, Shirt, AlertCircle 
} from "lucide-react";

// --- 急難救助包清單資料 ---
const checklistData = [
  {
    categoryId: "docs",
    title: "重要證件與財務",
    icon: FileText,
    theme: "text-blue-600 bg-blue-50 border-blue-100",
    items: [
      { id: "id_card", label: "身分證、健保卡 (正本或影本)" },
      { id: "cash", label: "少量現金與零錢" },
      { id: "contacts", label: "紙本重要聯絡人名冊" },
    ]
  },
  {
    categoryId: "water_food",
    title: "飲食與飲水 (建議備妥3日份)",
    icon: Droplet,
    theme: "text-cyan-600 bg-cyan-50 border-cyan-100",
    items: [
      { id: "water", label: "瓶裝水 (每人每天約3公升)" },
      { id: "food", label: "高熱量乾糧、罐頭、保久乳" },
      { id: "opener", label: "開罐器與簡易餐具" },
    ]
  },
  {
    categoryId: "medical",
    title: "醫療與個人衛生",
    icon: BriefcaseMedical,
    theme: "text-emerald-600 bg-emerald-50 border-emerald-100",
    items: [
      { id: "first_aid", label: "急救包 (優碘、紗布、OK繃)" },
      { id: "meds", label: "個人慢性病藥物 (至少備妥2週)" },
      { id: "hygiene", label: "衛生紙、濕紙巾、女性生理用品" },
      { id: "mask", label: "醫療口罩與防塵口罩" },
    ]
  },
  {
    categoryId: "tools",
    title: "工具與通訊",
    icon: Wrench,
    theme: "text-amber-600 bg-amber-50 border-amber-100",
    items: [
      { id: "flashlight", label: "手電筒與備用電池" },
      { id: "radio", label: "可攜式收音機 (獲取外界資訊)" },
      { id: "powerbank", label: "行動電源與充電線" },
      { id: "whistle", label: "求救哨子、瑞士刀或多功能工具" },
    ]
  },
  {
    categoryId: "clothing",
    title: "衣物與保暖",
    icon: Shirt,
    theme: "text-violet-600 bg-violet-50 border-violet-100",
    items: [
      { id: "raincoat", label: "輕便雨衣 (防雨兼保暖)" },
      { id: "blanket", label: "急難保暖毯 (鋁箔材質)" },
      { id: "clothes", label: "輕便換洗衣物與粗棉手套" },
      { id: "shoes", label: "堅固好走的鞋子 (勿穿拖鞋)" },
    ]
  }
];

export default function PreparednessPage() {
  // 紀錄打勾狀態，格式為 { "id_card": true, "water": false, ... }
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  // 確認元件是否已經掛載 (用於解決 Next.js SSR 與 LocalStorage 的衝突)
  const [isMounted, setIsMounted] = useState(false);

  // 1. 網頁載入時，從手機 LocalStorage 讀取先前的紀錄
  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem("emergency_kit_progress");
    if (saved) {
      try {
        setCheckedItems(JSON.parse(saved));
      } catch (e) {
        console.error("讀取進度失敗", e);
      }
    }
  }, []);

  // 2. 當打勾狀態改變時，自動存入手機 LocalStorage
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("emergency_kit_progress", JSON.stringify(checkedItems));
    }
  }, [checkedItems, isMounted]);

  // 切換打勾狀態的函式
  const toggleItem = (id: string) => {
    setCheckedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // 計算進度百分比
  const totalItems = checklistData.reduce((acc, cat) => acc + cat.items.length, 0);
  const completedItems = Object.values(checkedItems).filter(Boolean).length;
  const progressPercent = totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100);

  // 避免畫面閃爍，在載入完成前先顯示骨架屏
  if (!isMounted) {
    return <div className="min-h-screen bg-[#f8fafc] animate-pulse"></div>;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans pb-24">
      {/* 頂部 Header 與進度條 */}
      <header className="pt-6 px-5 pb-6 bg-white border-b border-slate-100 sticky top-0 z-10 shadow-sm">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">防災準備</h1>
          <p className="text-sm text-slate-500 mt-1">急難救助包檢核表</p>
        </div>

        {/* 進度條區塊 */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <div className="flex justify-between items-end mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">準備進度</span>
            <span className="text-xl font-black text-teal-600">{progressPercent}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
            <div 
              className="bg-teal-500 h-2.5 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 text-right">
            已完成 {completedItems} / {totalItems} 項
          </p>
        </div>
      </header>

      {/* 清單內容區域 */}
      <main className="p-5 space-y-6">
        {checklistData.map((category) => {
          const CategoryIcon = category.icon;
          return (
            <section key={category.categoryId} className="bg-white rounded-3xl shadow-[0_2px_12px_rgb(0,0,0,0.02)] border border-slate-100 overflow-hidden">
              {/* 分類標題 */}
              <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-3">
                <div className={`p-2 rounded-xl border ${category.theme}`}>
                  <CategoryIcon size={18} />
                </div>
                <h2 className="font-bold text-slate-700 text-sm">{category.title}</h2>
              </div>

              {/* 該分類的物品清單 */}
              <div className="px-3 py-2">
                {category.items.map((item) => {
                  const isChecked = !!checkedItems[item.id];
                  return (
                    <div 
                      key={item.id} 
                      onClick={() => toggleItem(item.id)}
                      className="flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors hover:bg-slate-50 active:bg-slate-100"
                    >
                      {/* 打勾圖示 */}
                      <div className="mt-0.5 shrink-0 transition-colors duration-300">
                        {isChecked ? (
                          <CheckCircle2 size={22} className="text-teal-500 fill-teal-50" />
                        ) : (
                          <Circle size={22} className="text-slate-300" />
                        )}
                      </div>
                      
                      {/* 物品文字 (打勾後加上刪除線與變淡) */}
                      <span className={`text-sm leading-relaxed transition-all duration-300 ${
                        isChecked ? "text-slate-400 line-through" : "text-slate-700 font-medium"
                      }`}>
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

        {/* 底部溫馨提示 */}
        <section className="bg-amber-50/60 border border-amber-100/80 rounded-2xl p-4 flex gap-3 items-start shadow-sm mt-2">
          <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={18} />
          <div>
            <h4 className="text-sm font-bold text-amber-800 mb-1">存放建議</h4>
            <p className="text-xs text-amber-700/80 leading-relaxed">
              請將救助包放置於玄關、大門或床邊等隨手可及之處。建議每半年 (如換季時) 檢查一次水、食物與藥品的有效期限並進行替換。
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
