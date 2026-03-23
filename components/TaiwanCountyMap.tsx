// @ts-nocheck
// 檔案：components/TaiwanCountyMap.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { 
  getIntensityColor, 
  normalizeCountyName, 
  normalizeName, 
  calculateDistance, 
  calculateBaseGroundMotion, 
  getCWAIntensity 
} from "@/lib/earthquakeData";

interface TaiwanCountyMapProps {
  reportStage: "EEW" | "FORMAL";
  magnitude: number;
  intensities?: Record<string, string>;
  epicenterCoords?: [number, number];
}

const geoUrl = "https://cdn.jsdelivr.net/npm/taiwan-atlas/towns-10t.json";

// 幾何演算法：判斷線段交叉 (山脈屏障用)
const ccw = (A: number[], B: number[], C: number[]) => {
  return (C[1] - A[1]) * (B[0] - A[0]) > (B[1] - A[1]) * (C[0] - A[0]);
};
const checkIntersection = (A: number[], B: number[], C: number[], D: number[]) => {
  return ccw(A, C, D) !== ccw(B, C, D) && ccw(A, B, C) !== ccw(A, B, D);
};

// 幾何演算法：判斷點是否在多邊形內 (盆地共振用)
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

// 虛擬中央山脈脊線
const cmrSegments = [
  [[121.5, 24.5], [121.1, 23.8]], 
  [[121.1, 23.8], [120.7, 22.5]]  
];

// 深層盆地多邊形結界
const basins = {
  taipei: [
    [121.4, 25.1], [121.6, 25.1], [121.6, 24.9], [121.4, 24.9]
  ],
  yilan: [
    [121.7, 24.8], [121.9, 24.8], [121.9, 24.5], [121.7, 24.5]
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
    
    const strippedCounty = modernCounty.replace(/[縣市]$/, "");
    const matchCountyKey = Object.keys(intensities).find(k => k.replace(/[縣市]$/, "") === strippedCounty);
    if (matchCountyKey) return getIntensityColor(intensities[matchCountyKey]);

    // 🚨 終極修復：無震度區域的底色改為乾淨的微暖白 (#f8fafc)
    return "#f8fafc"; 
  };

  const idwGrid = useMemo(() => {
    if (!epicenterCoords || vs30Data.length === 0 || reportStage !== "EEW") return [];

    const basePoints = vs30Data.map(point => {
      const [lon, lat, vs30] = point;
      const dist = calculateDistance(epicenterCoords[1], epicenterCoords[0], lat, lon);
      
      let gm = calculateBaseGroundMotion(magnitude, dist, 10); 
      
      let siteAmp = vs30 < 300 ? 1.5 : (vs30 < 500 ? 1.2 : 1.0);
      let pga = gm.pga * siteAmp;
      let pgv = gm.pgv * siteAmp;

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
        pgv *= 0.40; 
      }

      return { lon, lat, pga, pgv };
    });

    const grid = [];
    const step = 0.03; 
    const searchRadiusSq = 0.2; 

    for (let lon = 119.9; lon <= 122.1; lon += step) {
      for (let lat = 21.8; lat <= 25.4; lat += step) {
        let sumWeight = 0;
        let sumValuePGA = 0;
        let sumValuePGV = 0;

        for (let i = 0; i < basePoints.length; i++) {
          const bp = basePoints[i];
          const dx = bp.lon - lon;
          const dy = bp.lat - lat;
          const distSq = dx * dx + dy * dy;

          if (distSq < 0.00001) {
            sumValuePGA = bp.pga;
            sumValuePGV = bp.pgv;
            sumWeight = 1;
            break;
          }

          if (distSq < searchRadiusSq) {
            const w = 1 / distSq;
            sumWeight += w;
            sumValuePGA += bp.pga * w;
            sumValuePGV += bp.pgv * w;
          }
        }

        if (sumWeight > 0) {
          let finalPga = sumValuePGA / sumWeight;
          let finalPgv = sumValuePGV / sumWeight;
          const targetPt = [lon, lat];

          if (isPointInPolygon(targetPt, basins.taipei)) {
            finalPga *= 1.8;
            finalPgv *= 2.2; 
          } else if (isPointInPolygon(targetPt, basins.yilan)) {
            finalPga *= 2.0;
            finalPgv *= 2.5;
          }

          const intensity = getCWAIntensity(finalPga, finalPgv);
          const color = getIntensityColor(intensity);
          
          if (color !== "#f1f5f9" && color !== "#ffffff" && color !== "#f8fafc") {
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
