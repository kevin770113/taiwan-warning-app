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

// 🌟 幾何演算法 1：判斷線段交叉 (山脈屏障用)
const ccw = (A: number[], B: number[], C: number[]) => {
  return (C[1] - A[1]) * (B[0] - A[0]) > (B[1] - A[1]) * (C[0] - A[0]);
};
const checkIntersection = (A: number[], B: number[], C: number[], D: number[]) => {
  return ccw(A, C, D) !== ccw(B, C, D) && ccw(A, B, C) !== ccw(A, B, D);
};

// 🌟 幾何演算法 2：判斷點是否在多邊形內 (射線法 - 盆地共振用)
const isPointInPolygon = (point: number[], vs: number[][]) => {
  let x = point[0], y = point[1];
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    let xi = vs[i][0], yi = vs[i][1];
    let xj = vs[j][0], yj = vs[j][1];
    let intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

// 🏔️ 定義：虛擬中央山脈脊線
const cmrSegments = [
  [[121.5, 24.5], [121.1, 23.8]], 
  [[121.1, 23.8], [120.7, 22.5]]  
];

// 🥣 定義：深層盆地多邊形結界 (Z1.0 幾何共振區)
const basins = {
  taipei: [
    [121.4, 25.1], [121.6, 25.1], [121.6, 24.9], [121.4, 24.9] // 台北盆地粗略框線
  ],
  yilan: [
    [121.7, 24.8], [121.9, 24.8], [121.9, 24.5], [121.7, 24.5] // 蘭陽平原粗略框線
  ]
};

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

    // 1. 計算基礎點 PGA + 山脈屏障
    const basePoints = vs30Data.map(point => {
      const [lon, lat, vs30] = point;
      const dist = calculateDistance(epicenterCoords[1], epicenterCoords[0], lat, lon);
      let pga = calculatePGA(dist, magnitude, vs30);

      const epicPt = [epicenterCoords[0], epicenterCoords[1]];
      const targetPt = [lon, lat];
      let crossed = false;
      
      for (const seg of cmrSegments) {
        if (checkIntersection(epicPt, targetPt, seg[0], seg[1])) {
          crossed = true;
          break;
        }
      }

      if (crossed) {
        pga *= 0.35; 
      }

      return { lon, lat, pga };
    });

    const grid = [];
    const step = 0.03; 
    const searchRadiusSq = 0.2; 

    // 2. IDW 空間內插 + 盆地共振爆發
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
          let finalPga = sumValue / sumWeight;
          const targetPt = [lon, lat];

          // 🌟 終極殺招：盆地效應 (如果像素掉入盆地，強制爆發 1.8~2.0 倍能量)
          if (isPointInPolygon(targetPt, basins.taipei)) {
            finalPga *= 1.8; // 台北盆地共振放大 1.8 倍
          } else if (isPointInPolygon(targetPt, basins.yilan)) {
            finalPga *= 2.0; // 蘭陽平原極軟弱沖積層放大 2.0 倍
          }

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

        {reportStage === "EEW" && epicenterCoords && idwGrid.length > 0 && (
          <g mask="url(#taiwan-mask)" opacity={0.85}>
            {idwGrid.map((pt, index) => (
              <Marker key={index} coordinates={[pt.lon, pt.lat]}>
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
