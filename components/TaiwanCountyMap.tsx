// @ts-nocheck
"use client";

import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { getIntensityColor, normalizeCountyName } from "@/lib/earthquakeData";

interface TaiwanCountyMapProps {
  intensities?: Record<string, string>;
  epicenterCoords?: [number, number]; // 接收震央座標
}

// 確保這裡的檔名跟你 public 資料夾裡的一模一樣
const geoUrl = "/taiwan-topo.json";

export default function TaiwanCountyMap({ intensities = {}, epicenterCoords }: TaiwanCountyMapProps) {
  
  const getFillColor = (topoName: string) => {
    // 1. 先用翻譯蒟蒻把舊名字換成新名字 (解決白色破洞)
    const modernName = normalizeCountyName(topoName);
    // 2. 拿新名字去對應震度
    const intensity = intensities[modernName];
    return getIntensityColor(intensity || "0");
  };

  return (
    <div className="w-full max-w-[320px] mx-auto drop-shadow-sm flex justify-center items-center overflow-hidden">
      {/* scale 從 7500 放大到 9200，center 微調到 120.8, 23.7 讓台灣完美置中 */}
      <ComposableMap 
        projection="geoMercator" 
        projectionConfig={{ scale: 9200, center: [120.8, 23.7] }}
        style={{ width: "100%", height: "auto" }}
      >
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const countyName = geo.properties.name;
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={getFillColor(countyName)}
                  stroke="#ffffff"
                  strokeWidth={1}
                  style={{
                    default: { outline: "none", transition: "fill 0.5s ease" },
                    hover: { filter: "brightness(0.9)", outline: "none" },
                    pressed: { outline: "none" },
                  }}
                />
              );
            })
          }
        </Geographies>

        {/* 震央標記：如果有傳入座標，就畫出紅色脈衝圓圈 */}
        {epicenterCoords && (
          <Marker coordinates={epicenterCoords}>
            {/* 動畫外圈 (雷達波紋) */}
            <circle r={10} fill="#ef4444" className="animate-ping opacity-60" />
            {/* 實體內圈 */}
            <circle r={4} fill="#ef4444" stroke="#ffffff" strokeWidth={1.5} />
          </Marker>
        )}
      </ComposableMap>
    </div>
  );
}
