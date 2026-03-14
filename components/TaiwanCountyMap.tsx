"use client";

import { getIntensityColor } from "@/lib/earthquakeData";

interface TaiwanCountyMapProps {
  // 傳入各縣市的震度，例如：{"花蓮縣": "6弱", "台北市": "3"}
  intensities?: Record<string, string>;
}

export default function TaiwanCountyMap({ intensities = {} }: TaiwanCountyMapProps) {
  // 輔助函式：根據縣市名稱，找出對應的震度並回傳顏色
  const getFillColor = (countyName: string) => {
    const intensity = intensities[countyName];
    return getIntensityColor(intensity || "0"); // 找不到就回傳預設底色
  };

  return (
    <div className="w-full max-w-[280px] mx-auto drop-shadow-sm flex justify-center items-center p-4">
      {/* ========================================================================
        ⚠️ 注意：為了避免 AI 產生變形地圖，我將真實的 SVG 複雜路徑省略。
        在實務上，你只需要去開源網站下載一份「台灣縣市 SVG 地圖」，
        然後把它貼在下方的 <svg> 裡面。
        
        重點是：確保每個 <path> 都有標註正確的縣市名稱 (id="台北市" 或 name="台北市")
        我們透過 style={{ fill: getFillColor("縣市名稱") }} 來動態上色！
        ========================================================================
      */}
      
      <svg 
        viewBox="0 0 400 600" 
        className="w-full h-auto transition-colors duration-500"
        stroke="#ffffff" // 縣市交界線用白色
        strokeWidth="1.5"
      >
        {/* 以下為極簡示意區塊 (請在未來替換為真實的 22 縣市 SVG <path>) */}
        
        {/* 北部示意區塊 */}
        <path 
          d="M 150 50 L 250 50 L 250 150 L 150 150 Z" 
          fill={getFillColor("台北市")} 
          className="transition-colors duration-700"
        />
        <text x="200" y="105" fontSize="14" fill="#64748b" textAnchor="middle">台北市</text>

        {/* 中部示意區塊 */}
        <path 
          d="M 100 150 L 250 150 L 250 300 L 100 300 Z" 
          fill={getFillColor("台中市")} 
          className="transition-colors duration-700"
        />
        <text x="175" y="230" fontSize="14" fill="#64748b" textAnchor="middle">台中市</text>

        {/* 東部示意區塊 (花蓮) */}
        <path 
          d="M 250 150 L 350 150 L 300 350 L 250 300 Z" 
          fill={getFillColor("花蓮縣")} 
          className="transition-colors duration-700"
        />
        <text x="290" y="240" fontSize="14" fill="#ffffff" textAnchor="middle" className="font-bold drop-shadow-md">花蓮縣</text>

        {/* 南部示意區塊 */}
        <path 
          d="M 50 300 L 250 300 L 200 550 L 50 450 Z" 
          fill={getFillColor("高雄市")} 
          className="transition-colors duration-700"
        />
        <text x="150" y="420" fontSize="14" fill="#64748b" textAnchor="middle">高雄市</text>

      </svg>
    </div>
  );
}
