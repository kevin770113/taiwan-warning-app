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
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const width = 200;
    const height = 400;
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    const centerPx = getPixelCoords(epicenter.lng, epicenter.lat);

    const getColor = (intensity: number) => {
      // 微調色階：讓底色過渡更柔和自然
      if (intensity < 1) return [0, 0, 0, 0];
      if (intensity < 2) return [134, 239, 172, 100]; // 淺綠
      if (intensity < 3) return [253, 224, 71, 180]; // 黃色
      if (intensity < 4) return [251, 146, 60, 220]; // 橘色
      if (intensity < 5) return [244, 63, 94, 240];  // 玫瑰紅
      return [159, 18, 57, 255]; // 深紅 (5強以上)
    };

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dx = x - centerPx.x;
        const dy = y - centerPx.y;
        const distPx = Math.sqrt(dx * dx + dy * dy);
        
        let baseIntensity = (magnitude * 1.6) - (distPx * 0.035);
        if (baseIntensity < 0) baseIntensity = 0;

        let siteMultiplier = 1.0;
        
        // 矩陣交互計算：疊加多個地形的影響
        SITE_EFFECTS.forEach(site => {
          const sitePx = getPixelCoords(site.lng, site.lat);
          const sdx = x - sitePx.x;
          const sdy = y - sitePx.y;
          const sDist = Math.sqrt(sdx * sdx + sdy * sdy);
          
          if (sDist < site.radiusKm) {
            // 使用更平滑的餘弦遞減公式 (Cosine Interpolation) 取代線性，邊緣融合更自然
            const effectRatio = (Math.cos(Math.PI * (sDist / site.radiusKm)) + 1) / 2;
            siteMultiplier += (site.weight - 1.0) * effectRatio;
          }
        });

        // 限制最大與最小乘數，避免異常極值
        siteMultiplier = Math.max(0.5, Math.min(siteMultiplier, 1.8));
        const finalIntensity = baseIntensity * siteMultiplier;

        const [r, g, b, a] = getColor(finalIntensity);
        const index = (y * width + x) * 4;
        data[index] = r;
        data[index + 1] = g;
        data[index + 2] = b;
        data[index + 3] = a;
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }, [epicenter, magnitude]);

  return (
    <div className="relative w-full max-w-[240px] mx-auto flex justify-center items-center">
      
      {/* 立體陰影層：為台灣地圖增加微微的海軍藍立體浮雕感 */}
      <svg viewBox="0 0 200 400" className="absolute top-[2px] left-[2px] w-full h-full text-slate-300/50 blur-[2px]">
        <path d={TAIWAN_SVG_PATH} fill="currentColor" />
      </svg>

      {/* 乾淨的底圖輪廓 */}
      <svg viewBox="0 0 200 400" className="absolute top-0 left-0 w-full h-full text-slate-100">
        <path d={TAIWAN_SVG_PATH} fill="currentColor" stroke="#cbd5e1" strokeWidth="1.5" />
      </svg>

      {/* 高斯模糊與色彩增值混合 (mix-blend-multiply)：
          這是讓熱力圖「消除像素感」並擁有高級氣象渲染圖質感的魔法！
      */}
      <div 
        className="w-full h-full relative"
        style={{ clipPath: `path('${TAIWAN_SVG_PATH}')` }}
      >
        <canvas
          ref={canvasRef}
          width={200}
          height={400}
          // 這裡加上了 blur-[6px] 讓邊界完全柔化，mix-blend 讓色彩滲透到底圖上
          className="w-full h-auto opacity-85 blur-[6px] mix-blend-multiply"
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      {/* 震央標記 🌟 */}
      {(() => {
        const px = getPixelCoords(epicenter.lng, epicenter.lat);
        if (px.x >= -10 && px.x <= 210 && px.y >= -10 && px.y <= 410) {
          return (
            <div 
              className="absolute w-5 h-5 rounded-full border-[2.5px] border-white bg-rose-500 animate-pulse flex items-center justify-center shadow-[0_0_15px_rgba(244,63,94,0.6)]"
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
