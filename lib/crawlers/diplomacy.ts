// 檔案：lib/crawlers/diplomacy.ts

export async function fetchDiplomacyData() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); 

    const query = encodeURIComponent('"旅遊警示" ("陸委會" OR "外交部") ("中國" OR "大陸" OR "港澳" OR "台灣")');
    const url = `https://news.google.com/rss/search?q=${query}&hl=zh-TW&gl=TW&ceid=TW:zh-Hant`;
    
    const res = await fetch(url, { signal: controller.signal, next: { revalidate: 3600 } }); 
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    
    const xmlString = await res.text();
    clearTimeout(timeoutId);

    const rawAlerts: any[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const descRegex = /<description>([\s\S]*?)<\/description>/;
    const pubDateRegex = /<pubDate>([\s\S]*?)<\/pubDate>/;

    let match;
    while ((match = itemRegex.exec(xmlString)) !== null) {
      const itemXml = match[1];
      const descMatch = descRegex.exec(itemXml);
      let fullTitle = "";

      // 🚨 零妥協萃取：潛入 description 挖出被 a 標籤包覆的「無截斷完整標題」
      if (descMatch) {
        const aTagMatch = /<a[^>]*>([\s\S]*?)<\/a>/.exec(descMatch[1]);
        if (aTagMatch) {
          // 清除 CDATA 與殘留的 HTML 標籤
          fullTitle = aTagMatch[1].replace(/<!\[CDATA\[|\]\]>/g, "").replace(/<[^>]+>/g, "").trim();
        }
      }

      // 備案：如果 description 萃取失敗，才退回使用可能被截斷的 title
      if (!fullTitle) {
        const titleMatch = /<title>([\s\S]*?)<\/title>/.exec(itemXml);
        if (titleMatch) fullTitle = titleMatch[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim();
      }

      // 清理：順手砍掉 " - 媒體名稱"，讓警示文字更純粹
      fullTitle = fullTitle.replace(/\s*[-|｜_]\s*[^-|｜_]+$/, '');

      if (fullTitle) {
        rawAlerts.push({
          title: fullTitle,
          publishedAt: pubDateRegex.exec(itemXml)?.[1] || new Date().toISOString()
        });
      }
    }

    const negativeRegex = /(中東|以色列|巴林|黎巴嫩|伊朗|加薩|遊戲|娛樂|動漫|電競|影劇|手遊|虛擬|真人版|航海王|演唱會|賽季|抽卡|粉絲|明星|八卦|網紅)/;
    
    const filteredAlerts = rawAlerts.filter((item: any) => {
      const t = item.title;
      if (negativeRegex.test(t)) return false; 
      return (t.includes("紅色") || t.includes("橙色") || t.includes("黃色"));
    });

    if (filteredAlerts.length === 0) {
      return [{ id: 1, country: "兩岸與周邊地區", flag: "🌍", status: "近期無重大旅遊警示變更", level: "normal", time: new Date().toLocaleTimeString("zh-TW", { timeZone: 'Asia/Taipei', hour: "2-digit", minute: "2-digit" }) }];
    }

    return filteredAlerts.slice(0, 4).map((item: any, index: number) => {
      let uiLevel = "normal";
      let statusText = "黃色警示 (注意)";
      let flagIcon = "❕";
      
      if (item.title.includes("紅色")) {
        uiLevel = "critical";
        statusText = "紅色警示 (不宜前往)";
        flagIcon = "🚫";
      } else if (item.title.includes("橙色")) {
        uiLevel = "warning";
        statusText = "橙色警示 (避免非必要旅行)";
        flagIcon = "⚠️";
      } else if (item.title.includes("黃色")) {
        uiLevel = "notice";
        statusText = "黃色警示 (特別注意安全)";
        flagIcon = "❕";
      }
      
      const pubDate = new Date(item.publishedAt);
      const timeStr = isNaN(pubDate.getTime()) ? "近期" : `${pubDate.getMonth() + 1}/${pubDate.getDate()}`;

      return {
        id: index + 1,
        country: item.title, 
        flag: flagIcon,
        status: statusText,
        level: uiLevel,
        time: timeStr 
      };
    });

  } catch (error) {
    console.error("❌ 外交爬蟲發生錯誤:", error);
    return [{ id: 1, country: "連線異常", flag: "📡", status: "無法代理取得陸委會/外交部資料", level: "normal", time: "--" }];
  }
}
