// 檔案：lib/crawlers/diplomacy.ts

export async function fetchDiplomacyData() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); 

    // 🤝 外交突破：透過 Google News 代理搜尋官方旅遊警示
    const query = encodeURIComponent('"外交部" ("旅遊警示" OR "紅色警示" OR "橙色警示" OR "黃色警示")');
    const url = `https://news.google.com/rss/search?q=${query}&hl=zh-TW&gl=TW&ceid=TW:zh-Hant`;
    
    const res = await fetch(url, { signal: controller.signal, next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    
    const xmlString = await res.text();
    clearTimeout(timeoutId);

    const rawAlerts: any[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const titleRegex = /<title>([\s\S]*?)<\/title>/;
    const pubDateRegex = /<pubDate>([\s\S]*?)<\/pubDate>/;

    let match;
    while ((match = itemRegex.exec(xmlString)) !== null) {
      const itemXml = match[1];
      const titleMatch = titleRegex.exec(itemXml);
      if (titleMatch) {
        rawAlerts.push({
          title: titleMatch[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim(),
          publishedAt: pubDateRegex.exec(itemXml)?.[1] || new Date().toISOString()
        });
      }
    }

    // 篩選出真的帶有顏色警示的新聞
    const criticalWarnings = rawAlerts.filter((item: any) => {
      const t = item.title;
      return t.includes("紅色") || t.includes("橙色") || t.includes("黃色");
    });

    if (criticalWarnings.length === 0) {
      return [{ id: 1, country: "全球", flag: "🌍", status: "無近期重大旅遊警示變更", level: "normal", time: new Date().toLocaleTimeString("zh-TW", { timeZone: 'Asia/Taipei', hour: "2-digit", minute: "2-digit" }) }];
    }

    // 取前 4 筆最新警示，並轉換為 UI 所需的格式
    return criticalWarnings.slice(0, 4).map((item: any, index: number) => {
      let uiLevel = "normal";
      let statusText = "黃色警示 (注意)";
      
      if (item.title.includes("紅色")) {
        uiLevel = "warning";
        statusText = "紅色警示 (不宜前往)";
      } else if (item.title.includes("橙色")) {
        uiLevel = "warning";
        statusText = "橙色警示 (避免非必要旅行)";
      } else if (item.title.includes("黃色")) {
        uiLevel = "notice";
      }
      
      const pubDate = new Date(item.publishedAt);
      const timeStr = isNaN(pubDate.getTime()) ? "近期" : `${pubDate.getMonth() + 1}/${pubDate.getDate()}`;

      return {
        id: index + 1,
        // 直接將標題截斷作為顯示文字 (因為很難完美拆出國家名，保留標題最準確)
        country: item.title.length > 20 ? item.title.substring(0, 20) + "..." : item.title,
        flag: uiLevel === "warning" ? "🚫" : "⚠️",
        status: statusText,
        level: uiLevel,
        time: timeStr 
      };
    });

  } catch (error) {
    console.error("❌ 外交爬蟲發生錯誤:", error);
    return [{ id: 1, country: "連線異常", flag: "📡", status: "無法取得外交部資料", level: "normal", time: "--" }];
  }
}
