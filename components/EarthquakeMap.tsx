"use client";

import { useEffect, useRef } from "react";
import { TAIWAN_SVG_PATH, getPixelCoords, SITE_EFFECTS } from "@/lib/taiwanGeo";

interface EarthquakeMapProps {
  epicenter: { lng: number; lat: number };
  magnitude: number;
}

export default function EarthquakeMap({ epicenter, magnitude }: EarthquakeMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = 200;
    const height = 400;
    // 建立空的像素資料陣列
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    // 取得震央的畫布座標
    const centerPx = getPixelCoords(epicenter.lng, epicenter.lat);

    // 震度轉顏色的輔助函式 (從透明青綠 -> 黃 -> 橘 -> 紅)
    const getColor = (intensity: number) => {
      if (intensity < 1) return [20, 184, 166, 0]; // 透明
      if (intensity < 2) return [20, 184, 166, 80]; // Teal (震度 1-2)
      if (intensity < 3) return [250, 204, 21, 150]; // Yellow (震度 3)
      if (intensity < 4) return [249, 115, 22, 200]; // Orange (震度 4)
      return [244, 63, 94, 230]; // Rose (震度 5+)
    };

    // 遍歷畫布上的每一個像素 (這就是 GPU 級的渲染邏輯)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // 1. 計算該像素與震央的距離 (簡單用畫素距離當比例)
        const dx = x - centerPx.x;
        const dy = y - centerPx.y;
        const distPx = Math.sqrt(dx * dx + dy * dy);
        
        // 2. 基礎震波衰減公式 (模擬物理現象：規模越大初始越強，距離越遠越弱)
        // 這是一個簡化版的視覺公式，讓規模 6 的地震大約能擴散半個台灣
        let baseIntensity = (magnitude * 1.5) - (distPx * 0.03);
        if (baseIntensity < 0) baseIntensity = 0;

        // 3. 場址效應 (Site Effects) 修正：判斷該像素是否在地質特異區
        let siteMultiplier = 1.0;
        // (為了效能，這裡用畫布座標粗略推算影響範圍)
        SITE_EFFECTS.forEach(site => {
          const sitePx = getPixelCoords(site.lng, site.lat);
          const sdx = x - sitePx.x;
          const sdy = y - sitePx.y;
          const sDist = Math.sqrt(sdx * sdx + sdy * sdy);
          // 如果像素在該地形的影響半徑內，加上權重變化
          if (sDist < site.radiusKm) {
            // 越靠近地形中心，地形效應越明顯 (線性遞減)
            const effectRatio = 1 - (sDist / site.radiusKm);
            siteMultiplier += (site.weight - 1.0) * effectRatio;
          }
        });

        // 4. 算出最終的修正震度
        const finalIntensity = baseIntensity * siteMultiplier;

        // 5. 填入 rgba 像素資料
        const [r, g, b, a] = getColor(finalIntensity);
        const index = (y * width + x) * 4;
        data[index] = r;
        data[index + 1] = g;
        data[index + 2] = b;
        data[index + 3] = a;
      }
    }

    // 將算好的像素資料一次性畫上 Canvas
    ctx.putImageData(imageData, 0, 0);
  }, [epicenter, magnitude]);

  return (
    <div className="relative w-full max-w-[240px] mx-auto flex justify-center items-center drop-shadow-md">
      
      {/* 底圖輪廓 (淡灰色) */}
      <svg viewBox="0 0 200 400" className="absolute top-0 left-0 w-full h-full text-slate-200">
        <path d={TAIWAN_SVG_PATH} fill="currentColor" stroke="#e2e8f0" strokeWidth="2" />
      </svg>

      {/* 核心魔法：使用 CSS 的 clip-path
        這會把正方形的 Canvas 精準地沿著台灣的邊界裁切！
        海的部分不會有顏色，漸層只會出現在陸地上。
      */}
      <div 
        className="w-full h-full relative"
        style={{ clipPath: `path('${TAIWAN_SVG_PATH}')` }}
      >
        <canvas
          ref={canvasRef}
          width={200}
          height={400}
          className="w-full h-auto opacity-90"
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      {/* 震央標記 🌟 (疊加在最上層) */}
      {(() => {
        const px = getPixelCoords(epicenter.lng, epicenter.lat);
        // 確保震央落在畫面內才顯示
        if (px.x >= 0 && px.x <= 200 && px.y >= 0 && px.y <= 400) {
          return (
            <div 
              className="absolute w-4 h-4 rounded-full border-2 border-white bg-rose-500 animate-ping flex items-center justify-center shadow-lg"
              style={{ 
                left: `${(px.x / 200) * 100}%`, 
                top: `${(px.y / 400) * 100}%`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            </div>
          );
        }
        return null;
      })()}
      
    </div>
  );
}
