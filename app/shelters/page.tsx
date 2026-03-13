"use client";

import { useState, useMemo } from "react";
import { MapPin, Users, Copy, Check, Shield, WifiOff } from "lucide-react";
import { mockShelterData, type Shelter } from "@/lib/shelterData";

export default function SheltersPage() {
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 取得所有縣市列表
  const cities = Object.keys(mockShelterData);
  
  // 根據選擇的縣市，取得對應的行政區列表
  const districts = useMemo(() => {
    if (!selectedCity) return [];
    return Object.keys(mockShelterData[selectedCity] || {});
  }, [selectedCity]);

  // 根據選擇的縣市與行政區，取得避難所清單
  const shelters = useMemo(() => {
    if (!selectedCity || !selectedDistrict) return [];
    return mockShelterData[selectedCity][selectedDistrict] || [];
  }, [selectedCity, selectedDistrict]);

  // 處理縣市變更 (重置行政區)
  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCity(e.target.value);
    setSelectedDistrict(""); 
  };

  // 複製地址到剪貼簿功能
  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000); // 2秒後恢復圖示
    } catch (err) {
      console.error("複製失敗", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans pb-24 relative">
      
      {/* 頂部 Header 與狀態列 */}
      <header className="pt-6 px-5 pb-5 bg-white border-b border-slate-100 sticky top-0 z-20 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">避難所查詢</h1>
            <p className="text-sm text-slate-500 mt-1">防空疏散避難位置</p>
          </div>
          
          {/* 離線狀態指示燈 */}
          <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full shadow-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] font-bold text-emerald-700 tracking-wide">離線資料庫就緒</span>
          </div>
        </div>

        {/* 離線提示框 */}
        <div className="flex items-start gap-2 bg-slate-50 border border-slate-100 p-3 rounded-xl shadow-inner mb-4">
          <WifiOff size={16} className="text-slate-400 shrink-0 mt-0.5" />
          <p className="text-[13px] text-slate-600 leading-relaxed">
            系統已載入本地快取圖資。請從下方手動選擇您目前所在的縣市與行政區，以獲取最近的避難所地址。
          </p>
        </div>

        {/* 下拉選單區塊 */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <select 
              value={selectedCity}
              onChange={handleCityChange}
              className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl px-4 py-3 pr-8 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-shadow"
            >
              <option value="" disabled>選擇縣市</option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
            {/* 自訂下拉箭頭 */}
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>

          <div className="flex-1 relative">
            <select 
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              disabled={!selectedCity}
              className={`w-full appearance-none border text-sm font-bold rounded-xl px-4 py-3 pr-8 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-shadow ${
                !selectedCity ? "bg-slate-100 border-transparent text-slate-400 cursor-not-allowed" : "bg-slate-50 border-slate-200 text-slate-700"
              }`}
            >
              <option value="" disabled>選擇鄉鎮市區</option>
              {districts.map(dist => (
                <option key={dist} value={dist}>{dist}</option>
              ))}
            </select>
            <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 ${!selectedCity ? "text-slate-300" : "text-slate-400"}`}>
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
        </div>
      </header>

      {/* 清單結果區域 */}
      <main className="px-5 pt-4 space-y-3">
        {!selectedCity || !selectedDistrict ? (
          // 空白狀態引導
          <div className="flex flex-col items-center justify-center py-16 text-center opacity-60">
            <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-4 text-slate-400">
              <Shield size={32} />
            </div>
            <p className="text-slate-500 font-bold text-sm">請於上方選擇您所在的地區</p>
            <p className="text-slate-400 text-xs mt-1">即可顯示該區所有防空避難設施</p>
          </div>
        ) : shelters.length === 0 ? (
          // 找不到資料的防呆
          <div className="text-center py-10 text-slate-500 text-sm font-medium">
            此區域目前暫無資料。
          </div>
        ) : (
          // 避難所卡片列表
          <>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">
              找到 {shelters.length} 處避難所
            </div>
            {shelters.map((shelter) => (
              <div key={shelter.id} className="bg-white p-4 rounded-2xl shadow-[0_2px_8px_rgb(0,0,0,0.03)] border border-slate-100 flex flex-col gap-3">
                
                {/* 建築名稱 */}
                <h3 className="font-bold text-slate-800 text-[15px] leading-tight flex items-start gap-2">
                  <Shield size={16} className="text-teal-600 shrink-0 mt-0.5" />
                  {shelter.name}
                </h3>
                
                {/* 容納人數與地址 */}
                <div className="pl-6 space-y-2">
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
                    <Users size={14} className="text-amber-500" />
                    <span>預估可容納 <strong className="text-slate-700">{shelter.capacity}</strong> 人</span>
                  </div>
                  
                  <div className="flex items-start gap-1.5 text-slate-600 text-xs">
                    <MapPin size={14} className="text-rose-500 shrink-0 mt-0.5" />
                    <span className="leading-relaxed font-medium">{shelter.address}</span>
                  </div>
                </div>

                {/* 操作按鈕 */}
                <div className="pl-6 mt-1">
                  <button 
                    onClick={() => handleCopy(shelter.id, shelter.address)}
                    className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors border ${
                      copiedId === shelter.id 
                        ? "bg-teal-50 text-teal-700 border-teal-200" 
                        : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 hover:text-slate-700"
                    }`}
                  >
                    {copiedId === shelter.id ? (
                      <><Check size={12} /> 已複製地址</>
                    ) : (
                      <><Copy size={12} /> 複製地址</>
                    )}
                  </button>
                </div>

              </div>
            ))}
          </>
        )}
      </main>

    </div>
  );
}
