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

// 🌟 指向你最新上傳的鄉鎮地圖檔
const geoUrl = "/taiwan-town-topo.json";

export default function TaiwanCountyMap({ reportStage, magnitude, intensities = {}, epicenterCoords }: TaiwanCountyMapProps) {
  const [vs30Data, setVs30Data] = useState<[number, number, number][]>([]);

  useEffect(() => {
    fetch("/vs30_grid.json")
      .then(res => {
        if (!res.ok) throw new Error("Try uppercase");
        return res.json();
      })
      .catch(() => fetch("/Vs30_grid.json").then(res => res.json()))
      .then(data => setVs30Data(data))
      .catch(err => console.error("Failed to load Vs30 grid", err));
  }, []);

  // 🌟 聰明繼承演算法：先找鄉鎮，找不到再找縣市
  const getFillColor = (countyName: string, townName: string) => {
    const modernCounty = normalizeCountyName(countyName);
    const intensity = intensities[townName] || intensities[modernCounty];
    return getIntensityColor(intensity || "0");
  };

  // 🌟 動態心跳半徑公式：至少 25，隨規模無限放大
  const heartbeatMaxR = Math.max(25, magnitude * 7);

  return (
    <div className="w-full max-w-[340px] mx-auto drop-shadow-sm flex justify-center items-center overflow-hidden">
      
      <ComposableMap 
        projection="geoMercator" 
        projectionConfig={{ scale: 8500, center: [121.0, 23.65] }}
        width={400}
        height={600}
        style={{ width: "100%", height: "auto", backgroundColor: reportStage === "EEW" ? "#f8fafc" : "transparent" }}
      >
        <defs>
          <filter id="heatmap-blur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        {/* 🌟 圖層反轉第一步：將熱力雲放在「最底層」(移除會當機的 clipPath) */}
        {reportStage === "EEW" && epicenterCoords && vs30Data.length > 0 && (
          <g filter="url(#heatmap-blur)">
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

        {/* 🌟 圖層反轉第二步：將 368 鄉鎮的「實體白線」蓋在熱力圖上面 */}
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const isEEW = reportStage === "EEW";
              const countyName = geo.properties.COUNTYNAME;
              const townName = geo.properties.TOWNNAME;

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  // EEW 時內部完全透明 (讓底層熱力透上來)，正式報告時智能上色
                  fill={isEEW ? "transparent" : getFillColor(countyName, townName)}
                  // 白色粗線框，負責把熱力圖「壓」出台灣形狀
                  stroke="#ffffff"
                  strokeWidth={isEEW ? 0.7 : 0.4}
                  style={{
                    default: { outline: "none", transition: "fill 0.5s ease" },
                    hover: { outline: "none", filter: isEEW ? "none" : "brightness(0.9)" },
                    pressed: { outline: "none" },
                  }}
                />
              );
            })
          }
        </Geographies>

        {/* 3. 頂層：完美節奏的動態震央心跳 */}
        {epicenterCoords && (
          <Marker coordinates={epicenterCoords}>
            {/* 大波：週期 3.5s */}
            <circle r="0" fill="none" stroke="#ef4444" strokeWidth="2.5">
              <animate attributeName="r" values={`0; ${heartbeatMaxR}`} dur="3.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.8; 0" dur="3.5s" repeatCount="indefinite" />
            </circle>

            {/* 小波：延遲 0.5s，創造「撲通..撲通」感 */}
            <circle r="0" fill="none" stroke="#ef4444" strokeWidth="2.5">
              <animate attributeName="r" values={`0; ${heartbeatMaxR}`} dur="3.5s" begin="0.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.8; 0" dur="3.5s" begin="0.5s" repeatCount="indefinite" />
            </circle>

            {/* 靜止核心 */}
            <circle r={3.5} fill="#ef4444" stroke="#ffffff" strokeWidth={1.5} />
          </Marker>
        )}
      </ComposableMap>
    </div>
  );
}
