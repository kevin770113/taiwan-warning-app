"use client";

import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { getIntensityColor } from "@/lib/earthquakeData";

interface TaiwanCountyMapProps {
  intensities?: Record<string, string>;
}

// 這裡指向你剛剛上傳到 public 的檔案名稱
const geoUrl = "/taiwan-topo.json";

export default function TaiwanCountyMap({ intensities = {} }: TaiwanCountyMapProps) {
  const getFillColor = (countyName: string) => {
    const intensity = intensities[countyName];
    return getIntensityColor(intensity || "0");
  };

  return (
    <div className="w-full max-w-[320px] mx-auto drop-shadow-sm flex justify-center items-center">
      {/* 設定台灣的中心經緯度與縮放比例 */}
      <ComposableMap 
        projection="geoMercator" 
        projectionConfig={{ scale: 7500, center: [120.5, 23.6] }}
        style={{ width: "100%", height: "auto" }}
      >
        {/* 自動解析你上傳的 TopoJSON 檔案 */}
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => {
              // 你的檔案裡有 geo.properties.name (例如："台北市")
              const countyName = geo.properties.name;
              
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={getFillColor(countyName)}
                  stroke="#ffffff"
                  strokeWidth={1}
                  style={{
                    default: { outline: "none", transition: "all 0.5s" },
                    hover: { filter: "brightness(0.9)", outline: "none" },
                    pressed: { outline: "none" },
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>
    </div>
  );
}
