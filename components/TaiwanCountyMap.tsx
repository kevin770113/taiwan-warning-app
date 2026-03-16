// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { getIntensityColor, normalizeCountyName, calculateDistance, calculateEEWIntensity } from "@/lib/earthquakeData";

interface TaiwanCountyMapProps {
  reportStage: "EEW" | "FORMAL";
  magnitude: number;
  intensities?: Record<string, string>;
  epicenterCoords?: [number, number];
}

const geoUrl = "/taiwan-topo.json";

export default function TaiwanCountyMap({ reportStage, magnitude, intensities = {}, epicenterCoords }: TaiwanCountyMapProps) {
  const [vs30Data, setVs30Data] = useState<[number, number, number][]>([]);

  useEffect(() => {
    fetch("/vs30_grid.json")
      .then(res => res.json())
      .then(data => setVs30Data(data))
      .catch(err => console.error("Failed to load Vs30 grid", err));
  }, []);

  const getFillColor = (topoName: string) => {
    const modernName = normalizeCountyName(topoName);
    const intensity = intensities[modernName];
    return getIntensityColor(intensity || "0");
  };

  return (
    <div className="w-full max-w-[340px] mx-auto drop-shadow-sm flex justify-center items-center overflow-hidden">
      
      {/* 🌟 魔法一：設定直向畫布 (400x600)，解決切頭切尾問題
        將 scale 拉高至 15000，並微調 center 使台灣本島完美佔滿畫面
      */}
      <ComposableMap 
        projection="geoMercator" 
        projectionConfig={{ scale: 15000, center: [120.9, 23.75] }}
        width={400}
        height={600}
        style={{ width: "100%", height: "auto" }}
      >
        {/* 🌟 魔法二：SVG 定義區 (高斯模糊濾鏡 + 台灣輪廓剪刀) */}
        <defs>
          {/* 強烈的高斯模糊，讓點與點融合 */}
          <filter id="heatmap-blur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="7" />
          </filter>

          {/* 台灣陸地輪廓裁切遮罩 (防止熱力圖溢出到外海) */}
          <clipPath id="taiwan-clip">
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => (
                  <Geography key={geo.rsmKey} geography={geo} />
                ))
              }
            </Geographies>
          </clipPath>
        </defs>

        {/* 1. 底層：台灣基底地圖 */}
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const isEEW = reportStage === "EEW";
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={isEEW ? "#e2e8f0" : getFillColor(geo.properties.name)}
                  stroke="#ffffff"
                  strokeWidth={isEEW ? 0.6 : 1}
                  style={{
                    default: { outline: "none", transition: "fill 0.5s ease" },
                    hover: { outline: "none", filter: isEEW ? "none" : "brightness(0.95)" },
                    pressed: { outline: "none" },
                  }}
                />
              );
            })
          }
        </Geographies>

        {/* 2. 中層：EEW 高解析平滑熱力圖 (套用裁切與模糊) */}
        {reportStage === "EEW" && epicenterCoords && (
          <g clipPath="url(#taiwan-clip)">
            <g filter="url(#heatmap-blur)">
              {vs30Data.map((point, index) => {
                const [lon, lat, vs30] = point;
                const dist = calculateDistance(epicenterCoords[1], epicenterCoords[0], lat, lon);
                const estIntensity = calculateEEWIntensity(dist, magnitude, vs30);
                const color = getIntensityColor(estIntensity);
                
                if (color === "#f1f5f9") return null;

                return (
                  <Marker key={index} coordinates={[lon, lat]}>
                    <circle r={12} fill={color} opacity={0.85} />
                  </Marker>
                );
              })}
            </g>
          </g>
        )}

        {/* 3. 頂層：震央水波紋動畫標記 */}
        {epicenterCoords && (
          <Marker coordinates={epicenterCoords}>
            {/* 🌟 魔法三：SVG 原生波紋擴散動畫 (大波) */}
            <circle r="0" fill="none" stroke="#ef4444" strokeWidth="2">
              <animate attributeName="r" values="0; 35" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.8; 0" dur="2s" repeatCount="indefinite" />
            </circle>

            {/* SVG 原生波紋擴散動畫 (小波：延遲 1 秒出發) */}
            <circle r="0" fill="none" stroke="#ef4444" strokeWidth="2">
              <animate attributeName="r" values="0; 35" dur="2s" begin="1s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.8; 0" dur="2s" begin="1s" repeatCount="indefinite" />
            </circle>

            {/* 靜止的實心震央紅點 */}
            <circle r={3.5} fill="#ef4444" stroke="#ffffff" strokeWidth={1.5} />
          </Marker>
        )}
      </ComposableMap>
    </div>
  );
}
