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

// 🌟 終極解法：直接抓取 g0v 零時政府開源的雲端標準 UTF-8 鄉鎮圖資！(免下載、絕對無亂碼)
const geoUrl = "https://raw.githubusercontent.com/g0v/twgeojson/master/json/twTown1982.topo.json";

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

  const getFillColor = (countyName: string, townName: string) => {
    const modernCounty = normalizeCountyName(countyName);
    const intensity = intensities[townName] || intensities[modernCounty];
    
    // 🌟 破除無資料保護色：給予稍深的灰藍色，而不是跟背景融合的極淺白
    if (!intensity || intensity === "0") return "#e2e8f0"; 
    return getIntensityColor(intensity);
  };

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

        {/* 1. 底層：EEW 高解析熱力雲 (完美套用模糊) */}
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

        {/* 2. 頂層：368 鄉鎮實體地圖 (鏤空網格壓制) */}
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
                  fill={isEEW ? "transparent" : getFillColor(countyName, townName)}
                  // 🌟 破除網格迷彩：EEW 使用深石板灰 (#94a3b8)，FORMAL 使用白色細線
                  stroke={isEEW ? "#94a3b8" : "#ffffff"}
                  strokeWidth={isEEW ? 0.6 : 0.3}
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

        {/* 3. 頂層之上的頂層：震央心跳動畫 */}
        {epicenterCoords && (
          <Marker coordinates={epicenterCoords}>
            <circle r="0" fill="none" stroke="#ef4444" strokeWidth="2.5">
              <animate attributeName="r" values={`0; ${heartbeatMaxR}`} dur="3.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.8; 0" dur="3.5s" repeatCount="indefinite" />
            </circle>

            <circle r="0" fill="none" stroke="#ef4444" strokeWidth="2.5">
              <animate attributeName="r" values={`0; ${heartbeatMaxR}`} dur="3.5s" begin="0.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.8; 0" dur="3.5s" begin="0.5s" repeatCount="indefinite" />
            </circle>

            <circle r={3.5} fill="#ef4444" stroke="#ffffff" strokeWidth={1.5} />
          </Marker>
        )}
      </ComposableMap>
    </div>
  );
}
