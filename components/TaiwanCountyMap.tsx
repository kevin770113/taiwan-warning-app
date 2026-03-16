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

// 🌟 幾何碰撞演算法：判斷兩條線段是否交叉 (射線追蹤用)
const ccw = (A: number[], B: number[], C: number[]) => {
  return (C[1] - A[1]) * (B[0] - A[0]) > (B[1] - A[1]) * (C[0] - A[0]);
};
const checkIntersection = (A: number[], B: number[], C: number[], D: number[]) => {
  return ccw(A, C, D) !== ccw(B, C, D) && ccw(A, B, C) !== ccw(A, B, D);
};

// 🌟 建立「虛擬中央山脈」脊線 (北從宜蘭大同，中經合歡山，南至大武山)
const cmrSegments = [
  [[121.5, 24.5], [121.1, 23.8]], 
  [[121.1, 23.8], [120.7, 22.5]]  
];

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

  const idwGrid = useMemo(() => {
    if (!epicenterCoords || vs30Data.length === 0 || reportStage !== "EEW") return [];

    // 1. 計算 464 個基礎地質點的 PGA，並在此處「啟動山脈屏障攔截」
    const basePoints = vs30Data.map(point => {
      const [lon, lat, vs30] = point;
      const dist = calculateDistance(epicenterCoords[1], epicenterCoords[0], lat, lon);
      let pga = calculatePGA(dist, magnitude, vs30);

      // 🌟 山脈屏障射線檢測：如果地震波穿過中央山脈，能量強制大幅衰減！
      const epicPt = [epicenterCoords[0], epicenterCoords[1]];
      const targetPt = [lon, lat];
      let crossed = false;
      
      for (const seg of cmrSegments) {
        if (checkIntersection(epicPt, targetPt, seg[0], seg[1])) {
          crossed = true;
          break;
        }
      }

      // 如果穿越山脈，PGA 削弱剩下 35% (高度阻擋效應)
      if (crossed) {
        pga *= 0.35; 
      }

      return { lon, lat, pga };
    });

    const grid = [];
    const step = 0.03; 
    const searchRadiusSq = 0.2; 

    // 2. IDW 空間內插
    for (let lon = 119.9; lon <= 122.1; lon += step) {
      for (let lat = 21.8; lat <= 25.4; lat += step) {
        let sumWeight = 0;
        let sumValue = 0;

        for (let i = 0; i < basePoints.length; i++) {
          const bp = basePoints[i];
          const dx = bp.lon - lon;
          const dy = bp.lat - lat;
          const distSq = dx * dx + dy * dy;

          if (distSq < 0.00001) {
            sumValue = bp.pga;
            sumWeight = 1;
            break;
          }

          if (distSq < searchRadiusSq) {
            const w = 1 / distSq;
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

        {/* 1. 底層：EEW 連續熱力漸層 */}
        {reportStage === "EEW" && epicenterCoords && idwGrid.length > 0 && (
          <g mask="url(#taiwan-mask)" opacity={0.85}>
            {idwGrid.map((pt, index) => (
              <Marker key={index} coordinates={[pt.lon, pt.lat]}>
                {/* 🌟 紗窗效應修復：寬高從 7 加大到 10，強制邊緣重疊，消滅微小縫隙！ */}
                <rect 
                  x={-5} y={-5} width={10} height={10} 
                  fill={pt.color} 
                  stroke={pt.color} 
                  strokeWidth={0.5} 
                />
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
