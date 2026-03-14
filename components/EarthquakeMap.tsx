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

    const width = 240;
    const height = 400;

    // 清空主畫布
    ctx.clearRect(0, 0, width, height);

    // ==========================================
    // 1. 在離線畫布計算熱力矩陣 (Offscreen Canvas)
    // ==========================================
    const offCanvas = document.createElement('canvas');
    offCanvas.width = width;
    offCanvas.height = height;
    const offCtx = offCanvas.getContext("2d");
    if (!offCtx) return;

    const imageData = offCtx.createImageData(width, height);
    const data = imageData.data;
    const centerPx = getPixelCoords(epicenter.lng, epicenter.lat);

    // 嚴格遵守 CWA 官方新制 10 級色階
    const getColor = (intensity: number) => {
      if (intensity < 0.5) return [0, 0, 0, 0];
      if (intensity < 2.5) return [134, 239, 172, 140]; // 1-2級: 綠
      if (intensity < 3.5) return [250, 204, 21, 180];  // 3級: 黃
      if (intensity < 4.5) return [249, 115, 22, 200];  // 4級: 橘
      if (intensity < 5.0) return [239, 68, 68, 220];   // 5弱: 淺紅
      if (intensity < 5.5) return [185, 28, 28, 230];   // 5強: 深紅
      if (intensity < 6.0) return [120, 53, 15, 240];   // 6弱: 深棕
      if (intensity < 6.5) return [107, 33, 168, 250];  // 6強: 深紫
      return [30, 27, 75, 255];                         // 7級: 紫黑
    };

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dx = x - centerPx.x;
        const dy = y - centerPx.y;
        const distPx = Math.sqrt(dx * dx + dy * dy);
        
        // 【核心修正】: 對數衰減模型 (Logarithmic Attenuation)
        // 更符合真實震波：近距離衰減極快，遠距離衰減平緩
        let baseIntensity = (1.2 * magnitude) - (1.8 * Math.log10(distPx + 5)) + 1.5;
        if (baseIntensity < 0) baseIntensity = 0;

        // 【核心修正】: 獨立高斯場址效應 (消除突兀斑塊)
        let maxMultiplier = 1.0;
        let minMultiplier = 1.0;
        
        SITE_EFFECTS.forEach(site => {
          const sitePx = getPixelCoords(site.lng, site.lat);
          const sdx = x - sitePx.x;
          const sdy = y - sitePx.y;
          const sDist = Math.sqrt(sdx * sdx + sdy * sdy);
          
          if (sDist < site.radiusKm * 1.5) {
            // 使用高斯常態分佈鐘形曲線 (Gaussian Bell Curve)
            const strength = Math.exp(-(sDist * sDist) / (2 * (site.radiusKm/2) * (site.radiusKm/2)));
            if (site.weight > 1) {
              const localMult = 1 + (site.weight - 1) * strength;
              if (localMult > maxMultiplier) maxMultiplier = localMult;
            } else {
              const localMult = 1 - (1 - site.weight) * strength;
              if (localMult < minMultiplier) minMultiplier = localMult;
            }
          }
        });

        const finalIntensity = baseIntensity * (maxMultiplier * minMultiplier);

        const [r, g, b, a] = getColor(finalIntensity);
        const index = (y * width + x) * 4;
        data[index] = r;
        data[index + 1] = g;
        data[index + 2] = b;
        data[index + 3] = a;
      }
    }
    offCtx.putImageData(imageData, 0, 0);

    // ==========================================
    // 2. 主畫布原生裁切渲染 (徹底解決對不齊與溢出)
    // ==========================================
    const taiwanPath = new Path2D(TAIWAN_SVG_PATH);

    // 畫上熱力圖 (並加上一點模糊讓色塊平滑)
    ctx.filter = "blur(6px)";
    ctx.drawImage(offCanvas, 0, 0);

    // 【魔法】: globalCompositeOperation 裁切
    // 這行指令會讓畫布「只保留與 taiwanPath 重疊的部分」，完美消除外海顏色
    ctx.filter = "none";
    ctx.globalCompositeOperation = "destination-in";
    ctx.fill(taiwanPath);

    // 恢復正常繪圖模式，疊加上乾淨的外框與底色
    ctx.globalCompositeOperation = "destination-over";
    ctx.fillStyle = "#f8fafc"; // 陸地底色
    ctx.fill(taiwanPath);

    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = "#cbd5e1"; // 海岸線
    ctx.lineWidth = 1.2;
    ctx.stroke(taiwanPath);

  }, [epicenter, magnitude]);

  return (
    <div className="relative w-full max-w-[240px] mx-auto flex justify-center items-center">
      <canvas
        ref={canvasRef}
        width={240}
        height={400}
        className="w-full h-auto drop-shadow-sm"
        style={{ width: '100%', height: '100%' }}
      />
      
      {/* 震央標記 */}
      {(() => {
        const px = getPixelCoords(epicenter.lng, epicenter.lat);
        return (
          <div 
            className="absolute w-4 h-4 rounded-full border-[2px] border-white bg-rose-500 animate-pulse flex items-center justify-center shadow-md pointer-events-none"
            style={{ 
              left: `${(px.x / 240) * 100}%`, 
              top: `${(px.y / 400) * 100}%`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
          </div>
        );
      })()}
    </div>
  );
}
