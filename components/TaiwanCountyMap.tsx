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
    // 雙重防呆抓取：先抓小寫檔名，如果找不到（報錯），自動去抓大寫檔名！
    fetch("/vs30_grid.json")
      .then(res => {
        if (!res.ok) throw new Error("Try uppercase");
        return res.json();
      })
      .catch(() => fetch("/Vs30_grid.json").then(res => res.json()))
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
      
      {/* 🌟 修復 1：直向畫布 (400x600)，並把 scale 溫和地降回 8500，保證不切頭切尾 */}
      <ComposableMap 
        projection="geoMercator" 
        projectionConfig={{ scale: 8500, center: [121.0, 23.65] }}
        width={400}
        height={600}
        style={{ width: "100%", height: "auto" }}
      >
        <defs>
          {/* 高斯模糊濾鏡：將點狀熱力融合成平滑雲霧 */}
          <filter id="heatmap-blur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" />
          </filter>

          {/* 台灣陸地輪廓裁切遮罩：防止熱力圖溢出到太平洋 */}
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

        {/* 2. 中層：EEW 高解析平滑熱力圖 (套用模糊與裁切) */}
        {/* 🌟 修復 2：加上 vs30Data.length > 0 判斷，確保資料載入後才啟動濾鏡，防當機 */}
        {reportStage === "EEW" && epicenterCoords && vs30Data.length > 0 && (
          <g clipPath="url(#taiwan-clip)" filter="url(#heatmap-blur)">
            {vs30Data.map((point, index) => {
              const [lon, lat, vs30] = point;
              const dist = calculateDistance(epicenterCoords[1], epicenterCoords[0], lat, lon);
              const estIntensity = calculateEEWIntensity(dist, magnitude, vs30);
              const color = getIntensityColor(estIntensity);
              
              if (color === "#f1f5f9") return null;

              return (
                <Marker key={index} coordinates={[lon, lat]}>
                  <circle r={10} fill={color} opacity={0.85} />
                </Marker>
              );
            })}
          </g>
        )}

        {/* 3. 頂層：震央同心圓水波紋動畫標記 */}
        {epicenterCoords && (
          <Marker coordinates={epicenterCoords}>
            {/* 🌟 修復 3：純正的 SVG 向外擴散水波紋 (大波) */}
            <circle r="0" fill="none" stroke="#ef4444" strokeWidth="2">
              <animate attributeName="r" values="0; 35" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.8; 0" dur="2s" repeatCount="indefinite" />
            </circle>

            {/* 純正的 SVG 向外擴散水波紋 (小波：延遲 1 秒出發) */}
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
