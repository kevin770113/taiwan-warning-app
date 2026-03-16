// @ts-nocheck
"use client";

import { useState, useEffect, useMemo } from "react";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { 
  getIntensityColor, 
  normalizeCountyName, 
  normalizeName, 
  calculateDistance, 
  calculatePGA, 
  getIntensityFromPGA 
} from "@/lib/earthquakeData";

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
    fetch("/vs30_grid.json")
      .then(res => {
        if (!res.ok) throw new Error("Try uppercase");
        return res.json();
      })
      .catch(() => fetch("/Vs30_grid.json").then(res => res.json()))
      .then(data => setVs30Data(data))
      .catch(err => console.error("Failed to load Vs30 grid", err));

    fetch(geoUrl)
      .then(res => res.json())
      .then(data => {
        if (data.objects && data.objects.towns) {
          setPureTownsTopo({ ...data, objects: { towns: data.objects.towns } });
        } else {
          setPureTownsTopo(data);
        }
      })
      .catch(err => console.error("Failed to load TopoJSON", err));
  }, []);

  const getFillColor = (countyName: string, townName: string) => {
    const modernCounty = normalizeCountyName(countyName);
    const modernTown = normalizeName(townName);

    if (intensities[modernTown]) return getIntensityColor(intensities[modernTown]);

    const strippedTown = modernTown.replace(/[鄉鎮市區]$/, "");
    const matchKey = Object.keys(intensities).find(k => k.replace(/[鄉鎮市區]$/, "") === strippedTown);
    if (matchKey) return getIntensityColor(intensities[matchKey]);

    if (intensities[modernCounty]) return getIntensityColor(intensities[modernCounty]);

    return "#e2e8f0"; 
  };

  // 🌟 神級引擎：純手工 IDW (反距離權重) 空間內插演算法
  const idwGrid = useMemo(() => {
    if (!epicenterCoords || vs30Data.length === 0 || reportStage !== "EEW") return [];

    // 1. 先算出 464 個已知地質點的「絕對 PGA 數值」
    const basePoints = vs30Data.map(point => {
      const [lon, lat, vs30] = point;
      const dist = calculateDistance(epicenterCoords[1], epicenterCoords[0], lat, lon);
      const pga = calculatePGA(dist, magnitude, vs30);
      return { lon, lat, pga };
    });

    const grid = [];
    const step = 0.04; // 網格細緻度 (越小越細，0.04 是手機效能與視覺的完美平衡)
    const searchRadiusSq = 0.25; // IDW 影響半徑 (平方值)

    // 2. 鋪設 4000+ 像素網格，涵蓋全台灣
    for (let lon = 119.9; lon <= 122.1; lon += step) {
      for (let lat = 21.8; lat <= 25.4; lat += step) {
        let sumWeight = 0;
        let sumValue = 0;

        // 3. 吸收周圍已知測站的 PGA
        for (let i = 0; i < basePoints.length; i++) {
          const bp = basePoints[i];
          const dx = bp.lon - lon;
          const dy = bp.lat - lat;
          const distSq = dx * dx + dy * dy;

          if (distSq < 0.00001) { // 剛好在測站正上方
            sumValue = bp.pga;
            sumWeight = 1;
            break;
          }

          if (distSq < searchRadiusSq) {
            const w = 1 / distSq; // 距離平方反比權重
            sumWeight += w;
            sumValue += bp.pga * w;
          }
        }

        if (sumWeight > 0) {
          const finalPga = sumValue / sumWeight;
          const intensity = getIntensityFromPGA(finalPga);
          const color = getIntensityColor(intensity);
          
          if (color !== "#f1f5f9") {
            grid.push({ lon, lat, color });
          }
        }
      }
    }
    return grid;
  }, [vs30Data, epicenterCoords, magnitude, reportStage]);

  const heartbeatMaxR = Math.max(25, magnitude * 7);

  if (!pureTownsTopo) return null; 

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

        {/* 1. 底層：EEW IDW 無縫連續熱力漸層 (完全消滅網格破綻) */}
        {reportStage === "EEW" && epicenterCoords && idwGrid.length > 0 && (
          <g mask="url(#taiwan-mask)">
            {idwGrid.map((pt, index) => (
              <Marker key={index} coordinates={[pt.lon, pt.lat]}>
                {/* 13 單位的半徑能讓 0.04 的網格完美交疊，形成無縫色塊 */}
                <circle r={13} fill={pt.color} opacity={0.85} stroke="none" />
              </Marker>
            ))}
          </g>
        )}

        {/* 2. 中層：368 鄉鎮實體地圖 */}
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
