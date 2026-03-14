"use client";

import { useEffect, useRef } from "react";
import { TAIWAN_COORDS, getProjectedCoords, SITE_EFFECTS } from "@/lib/taiwanGeo";

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

    const width = 240;
    const height = 400;

    // 1. 建立離線畫布 (Offscreen Canvas) 來計算純像素熱力數據
    const offCanvas = document.createElement('canvas');
    offCanvas.width = width;
    offCanvas.height = height;
    const offCtx = offCanvas.getContext("2d");
    if (!offCtx) return;

    const imageData = offCtx.createImageData(width, height);
    const data = imageData.data;
    const centerPx = getProjectedCoords(epicenter.lng, epicenter.lat, width, height);

    const getColor = (intensity: number) => {
      if (intensity < 1) return [0, 0, 0, 0];
      if (intensity < 2) return [134, 239, 172, 100]; // 淺綠
      if (intensity < 3) return [253, 224, 71, 180]; // 黃
      if (intensity < 4) return [251, 146, 60, 220]; // 橘
      if (intensity < 5) return [244, 63, 94, 240];  // 紅
      return [159, 18, 57, 255]; // 深紅
    };

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dx = x - centerPx.x;
        const dy = y - centerPx.y;
        const distPx = Math.sqrt(dx * dx + dy * dy);
        
        let baseIntensity = (magnitude * 1.6) - (distPx * 0.035);
        if (baseIntensity < 0) baseIntensity = 0;

        let siteMultiplier = 1.0;
        SITE_EFFECTS.forEach(site => {
          const sitePx = getProjectedCoords(site.lng, site.lat, width, height);
          const sdx = x - sitePx.x;
          const sdy = y - sitePx.y;
          const sDist = Math.sqrt(sdx * sdx + sdy * sdy);
          
          if (sDist < site.radiusKm) {
            const effectRatio = (Math.cos(Math.PI * (sDist / site.radiusKm)) + 1) / 2;
            siteMultiplier += (site.weight - 1.0) * effectRatio;
          }
        });

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
    offCtx.putImageData(imageData, 0, 0);

    // ==========================================
    // 2. 主畫布繪製 (絕對精準的輪廓對齊與裁切)
    // ==========================================
    ctx.clearRect(0, 0, width, height);

    // 建立台灣輪廓路徑
    const taiwanPath = new Path2D();
    TAIWAN_COORDS.forEach((coord, index) => {
      const px = getProjectedCoords(coord[0], coord[1], width, height);
      if (index === 0) taiwanPath.moveTo(px.x, px.y);
      else taiwanPath.lineTo(px.x, px.y);
    });
    taiwanPath.closePath();

    // 儲存乾淨的畫布狀態
    ctx.save();

    // 畫上海島底色
    ctx.fillStyle = "#f8fafc";
    ctx.fill(taiwanPath);

    // 【魔法發生處】：將畫布的繪圖區域「鎖死」在台灣輪廓內
    ctx.clip(taiwanPath);

    // 在輪廓內畫上熱力圖，並套用高斯模糊讓色塊柔和
    ctx.filter = "blur(8px)";
    ctx.drawImage(offCanvas, 0, 0);

    // 解除鎖死狀態
    ctx.restore();

    // 畫上銳利、完美貼合的外框線
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1.5;
    ctx.stroke(taiwanPath);

  }, [epicenter, magnitude]);

  return (
    <div className="relative w-full max-w-[240px] mx-auto flex justify-center items-center drop-shadow-sm">
      <canvas
        ref={canvasRef}
        width={240}
        height={400}
        className="w-full h-auto"
        style={{ width: '100%', height: '100%' }}
      />
      
      {/* 震央標記 🌟 */}
      {(() => {
        const px = getProjectedCoords(epicenter.lng, epicenter.lat, 240, 400);
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
