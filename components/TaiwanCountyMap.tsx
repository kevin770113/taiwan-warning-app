// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { getIntensityColor, normalizeCountyName, normalizeName, calculateDistance, calculateEEWIntensity } from "@/lib/earthquakeData";

interface TaiwanCountyMapProps {
  reportStage: "EEW" | "FORMAL";
  magnitude: number;
  intensities?: Record<string, string>;
  epicenterCoords?: [number, number];
}

// 🌟 修正了致命的烏龍：移除了 .topo，這才是真正的檔案路徑！
const geoUrl = "https://cdn.jsdelivr.net/npm/taiwan-atlas/towns-10t.json";

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
    const modernTown = normalizeName(townName);
    const intensity = intensities[modernTown] || intensities[modernCounty];
    
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
          <mask id="taiwan-mask">
            <rect x="-1000" y="-1000" width="3000" height="3000" fill="black" />
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies
                  // 🌟 致命攔截：過濾掉會把台灣蓋住的「國界」與「縣市」大圖塊
                  .filter(geo => geo.properties && geo.properties.TOWNNAME)
                  .map((geo) => (
                    <Geography key={geo.rsmKey} geography={geo} fill="white" />
                  ))
              }
            </Geographies>
          </mask>
        </defs>

        {/* 1. 底層：EEW 真實地質熱力點 (不規則場址效應，完美裁切) */}
        {reportStage === "EEW" && epicenterCoords && vs30Data.length > 0 && (
          <g mask="url(#taiwan-mask)">
            {vs30Data.map((point, index) => {
              const [lon, lat, vs30] = point;
              const dist = calculateDistance(epicenterCoords[1], epicenterCoords[0], lat, lon);
              const estIntensity = calculateEEWIntensity(dist, magnitude, vs30);
              const color = getIntensityColor(estIntensity);
              
              if (color === "#f1f5f9") return null;

              return (
                <Marker key={index} coordinates={[lon, lat]}>
                  <circle r={14} fill={color} opacity={0.85} />
                </Marker>
              );
            })}
          </g>
        )}

        {/* 2. 中層：現代版 368 鄉鎮實體地圖 */}
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies
              // 🌟 再次攔截：只畫有鄉鎮名稱的區塊，不畫疊加的大區塊
              .filter(geo => geo.properties && geo.properties.TOWNNAME)
              .map((geo) => {
                const isEEW = reportStage === "EEW";
                const props = geo.properties;
                const countyName = props.COUNTYNAME || "";
                const townName = props.TOWNNAME || "";

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={isEEW ? "transparent" : getFillColor(countyName, townName)}
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

        {/* 3. 頂層：震央心跳動畫 */}
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
