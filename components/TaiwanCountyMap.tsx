"use client";

import { getIntensityColor } from "@/lib/earthquakeData";

interface TaiwanCountyMapProps {
  intensities?: Record<string, string>;
}

export default function TaiwanCountyMap({ intensities = {} }: TaiwanCountyMapProps) {
  // 動態上色函式：找不到震度就回傳淡灰色底圖
  const getFillColor = (countyName: string) => {
    const intensity = intensities[countyName];
    return getIntensityColor(intensity || "0");
  };

  // 通用的 SVG Path 樣式
  const pathClass = "transition-all duration-700 hover:brightness-95 hover:stroke-[3px] cursor-pointer origin-center";

  return (
    <div className="w-full max-w-[300px] mx-auto drop-shadow-sm flex justify-center items-center p-2">
      <svg 
        viewBox="0 0 400 600" 
        className="w-full h-auto drop-shadow-md"
        stroke="#ffffff"
        strokeWidth="1.5"
        strokeLinejoin="round"
      >
        {/* =========================================================
            全台 22 縣市精確分佈 (已綁定 getFillColor)
            ========================================================= */}
        
        <g id="taiwan-map">
          {/* 基隆市 */}
          <path id="Keelung" d="M 285 55 L 295 52 L 292 60 Z" fill={getFillColor("基隆市")} className={pathClass}/>
          {/* 台北市 */}
          <path id="Taipei" d="M 260 65 L 280 55 L 290 65 L 275 80 Z" fill={getFillColor("台北市")} className={pathClass}/>
          {/* 新北市 */}
          <path id="NewTaipei" d="M 240 40 L 285 45 L 305 60 L 290 85 L 270 110 L 245 95 L 230 75 Z M 260 65 L 275 80 L 290 65 L 280 55 Z" fill={getFillColor("新北市")} fillRule="evenodd" className={pathClass}/>
          {/* 桃園市 */}
          <path id="Taoyuan" d="M 210 65 L 240 40 L 230 75 L 245 95 L 230 115 L 200 95 Z" fill={getFillColor("桃園市")} className={pathClass}/>
          {/* 新竹縣 */}
          <path id="HsinchuCounty" d="M 195 90 L 230 115 L 245 95 L 270 110 L 250 145 L 210 130 Z" fill={getFillColor("新竹縣")} className={pathClass}/>
          {/* 新竹市 */}
          <path id="HsinchuCity" d="M 190 95 L 205 92 L 200 105 Z" fill={getFillColor("新竹市")} className={pathClass}/>
          {/* 苗栗縣 */}
          <path id="Miaoli" d="M 170 120 L 210 130 L 250 145 L 215 185 L 160 160 Z" fill={getFillColor("苗栗縣")} className={pathClass}/>
          {/* 台中市 */}
          <path id="Taichung" d="M 155 165 L 215 185 L 250 145 L 270 110 L 290 140 L 260 210 L 215 220 L 150 200 Z" fill={getFillColor("台中市")} className={pathClass}/>
          {/* 彰化縣 */}
          <path id="Changhua" d="M 125 210 L 150 200 L 175 235 L 135 255 Z" fill={getFillColor("彰化縣")} className={pathClass}/>
          {/* 南投縣 */}
          <path id="Nantou" d="M 215 220 L 260 210 L 290 140 L 320 200 L 280 290 L 215 295 L 175 235 Z" fill={getFillColor("南投縣")} className={pathClass}/>
          {/* 雲林縣 */}
          <path id="Yunlin" d="M 105 240 L 135 255 L 175 235 L 215 295 L 165 305 L 100 280 Z" fill={getFillColor("雲林縣")} className={pathClass}/>
          {/* 嘉義縣 */}
          <path id="ChiayiCounty" d="M 90 285 L 165 305 L 215 295 L 220 330 L 180 340 L 140 330 L 85 320 Z M 130 305 L 150 300 L 145 320 L 125 315 Z" fill={getFillColor("嘉義縣")} fillRule="evenodd" className={pathClass}/>
          {/* 嘉義市 */}
          <path id="ChiayiCity" d="M 130 305 L 150 300 L 145 320 L 125 315 Z" fill={getFillColor("嘉義市")} className={pathClass}/>
          {/* 台南市 */}
          <path id="Tainan" d="M 80 325 L 140 330 L 180 340 L 210 350 L 175 410 L 120 405 L 70 370 Z" fill={getFillColor("台南市")} className={pathClass}/>
          {/* 高雄市 */}
          <path id="Kaohsiung" d="M 175 410 L 210 350 L 220 330 L 215 295 L 280 290 L 265 365 L 215 440 L 165 480 L 125 435 Z" fill={getFillColor("高雄市")} className={pathClass}/>
          {/* 屏東縣 */}
          <path id="Pingtung" d="M 165 480 L 215 440 L 265 365 L 250 420 L 220 500 L 195 560 L 185 550 L 175 500 Z" fill={getFillColor("屏東縣")} className={pathClass}/>
          {/* 宜蘭縣 */}
          <path id="Yilan" d="M 270 110 L 290 85 L 305 60 L 330 80 L 340 120 L 320 150 L 290 140 Z" fill={getFillColor("宜蘭縣")} className={pathClass}/>
          {/* 花蓮縣 */}
          <path id="Hualien" d="M 290 140 L 320 150 L 340 120 L 360 180 L 330 270 L 305 320 L 280 290 L 320 200 Z" fill={getFillColor("花蓮縣")} className={pathClass}/>
          {/* 台東縣 */}
          <path id="Taitung" d="M 280 290 L 305 320 L 330 270 L 280 390 L 250 420 L 265 365 Z" fill={getFillColor("台東縣")} className={pathClass}/>
          {/* 澎湖縣 (外島簡化版) */}
          <path id="Penghu" d="M 50 250 L 65 240 L 70 260 L 55 270 Z" fill={getFillColor("澎湖縣")} className={pathClass}/>
          {/* 金門縣 (外島簡化版) */}
          <path id="Kinmen" d="M 20 140 L 35 135 L 30 155 L 15 150 Z" fill={getFillColor("金門縣")} className={pathClass}/>
          {/* 連江縣/馬祖 (外島簡化版) */}
          <path id="Lienchiang" d="M 130 20 L 140 15 L 135 25 Z" fill={getFillColor("連江縣")} className={pathClass}/>
        </g>
      </svg>
    </div>
  );
}
