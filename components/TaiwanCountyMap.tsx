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

  // 載入我們萃取好的 464 個地質網格點
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
    <div className="w-full max-w-[340px] mx-auto drop-shadow-sm flex justify-center items-center overflow-hidden relative">
      
      {/* 🌟 注入專屬的雙波心跳動畫 (Systole/Diastole) */}
      <style>{`
        @keyframes doubleHeartbeat {
          0% { transform: scale(1); opacity: 0.8; }
          15% { transform: scale(1.6); opacity: 0.5; }
          30% { transform: scale(1); opacity: 0.8; }
          45% { transform: scale(3.5); opacity: 0; }
          100% { transform: scale(1); opacity: 0; }
        }
        .heartbeat-pulse {
          animation: doubleHeartbeat 2s infinite ease-out;
          transform-origin: center;
        }
      `}</style>

      {/* 🌟 放大 30%：scale 調整至 12000，center 調整確保本島置中 */}
      <ComposableMap 
        projection="geoMercator" 
        projectionConfig={{ scale: 12000, center: [121.0, 23.65] }}
        style={{ width: "100%", height: "auto" }}
      >
        {/* 底層地圖 (FORMAL 實心上色 / EEW 變成透明線框) */}
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const isEEW = reportStage === "EEW";
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={isEEW ? "#f8fafc" : getFillColor(geo.properties.name)}
                  stroke={isEEW ? "#cbd5e1" : "#ffffff"}
                  strokeWidth={isEEW ? 0.8 : 1}
                  style={{
                    default: { outline: "none", transition: "all 0.5s ease" },
                    hover: { filter: "brightness(0.95)", outline: "none" },
                    pressed: { outline: "none" },
                  }}
                />
              );
            })
          }
        </Geographies>

        {/* 🌟 高解析度熱力網格推估層 (只在 EEW 顯示) */}
        {reportStage === "EEW" && epicenterCoords && vs30Data.map((point, index) => {
          const [lon, lat, vs30] = point;
          const dist = calculateDistance(epicenterCoords[1], epicenterCoords[0], lat, lon);
          const estIntensity = calculateEEWIntensity(dist, magnitude, vs30);
          const color = getIntensityColor(estIntensity);
          
          // 如果推估震度為 0，就不畫出來節省效能
          if (color === "#f1f5f9") return null;

          return (
            <Marker key={index} coordinates={[lon, lat]}>
              <circle r={7} fill={color} opacity={0.65} style={{ mixBlendMode: "multiply" }} />
            </Marker>
          );
        })}

        {/* 🌟 3 倍大震央雙波心跳標記 */}
        {epicenterCoords && (
          <Marker coordinates={epicenterCoords}>
            {/* 雙波心跳擴散圈 */}
            <circle r={8} fill="#ef4444" className="heartbeat-pulse" />
            {/* 震央實體內圈 */}
            <circle r={3.5} fill="#ef4444" stroke="#ffffff" strokeWidth={1.5} />
          </Marker>
        )}
      </ComposableMap>
    </div>
  );
}
