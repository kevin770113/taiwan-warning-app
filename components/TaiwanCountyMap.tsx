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

const geoUrl = "https://cdn.jsdelivr.net/npm/taiwan-atlas/towns-10t.json";

export default function TaiwanCountyMap({ reportStage, magnitude, intensities = {}, epicenterCoords }: TaiwanCountyMapProps) {
  const [vs30Data, setVs30Data] = useState<[number, number, number][]>([]);
  const [pureTownsTopo, setPureTownsTopo] = useState<any>(null);

  useEffect(() => {
    // 1. 抓取 Vs30 熱力網格資料
    fetch("/vs30_grid.json")
      .then(res => {
        if (!res.ok) throw new Error("Try uppercase");
        return res.json();
      })
      .catch(() => fetch("/Vs30_grid.json").then(res => res.json()))
      .then(data => setVs30Data(data))
      .catch(err => console.error("Failed to load Vs30 grid", err));

    // 🌟 2. 終極拓撲隔離魔法：手動抓取地圖，並把除了鄉鎮以外的圖層全部在記憶體中摧毀
    fetch(geoUrl)
      .then(res => res.json())
      .then(data => {
        if (data.objects && data.objects.towns) {
          setPureTownsTopo({
            ...data,
            objects: { towns: data.objects.towns } // 強制只保留鄉鎮物件
          });
        } else {
          setPureTownsTopo(data);
        }
      })
      .catch(err => console.error("Failed to load TopoJSON", err));
  }, []);

  // 🌟 三段式嚴謹字串配對演算法 (解決同名但尾碼不同的問題)
  const getFillColor = (countyName: string, townName: string) => {
    const modernCounty = normalizeCountyName(countyName);
    const modernTown = normalizeName(townName);

    // 第一階段：完全命中 (例: 信義區 === 信義區)
    if (intensities[modernTown]) return getIntensityColor(intensities[modernTown]);

    // 第二階段：去尾碼比對 (例: 桃園市[區] === 桃園市[縣轄市])
    const strippedTown = modernTown.replace(/[鄉鎮市區]$/, "");
    const matchKey = Object.keys(intensities).find(k => k.replace(/[鄉鎮市區]$/, "") === strippedTown);
    if (matchKey) return getIntensityColor(intensities[matchKey]);

    // 第三階段：繼承縣市最大震度
    if (intensities[modernCounty]) return getIntensityColor(intensities[modernCounty]);

    return "#e2e8f0"; // 無資料
  };

  const heartbeatMaxR = Math.max(25, magnitude * 7);

  if (!pureTownsTopo) return null; // 等待地圖載入

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
          {/* 🌟 終極鎖死座標系：加入 maskUnits="userSpaceOnUse" 確保反向遮罩絕對不飄移 */}
          <mask id="taiwan-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="400" height="600">
            <rect x="-1000" y="-1000" width="3000" height="3000" fill="black" />
            <Geographies geography={pureTownsTopo}>
              {({ geographies }) =>
                geographies.map((geo) => (
                  <Geography key={geo.rsmKey} geography={geo} fill="white" />
                ))
              }
            </Geographies>
          </mask>
        </defs>

        {/* 1. 底層：EEW PGA 物理熱力雲 (被鎖死的 Mask 完美裁切) */}
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

        {/* 2. 中層：368 鄉鎮實體地圖 (三段式填色) */}
        <Geographies geography={pureTownsTopo}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const isEEW = reportStage === "EEW";
              const props = geo.properties;
              const countyName = props.COUNTYNAME || props.COUNTY || props.C_Name || "";
              const townName = props.TOWNNAME || props.TOWN || props.T_Name || "";

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
