// 檔案：lib/crawlers/diplomacy.ts

export async function fetchDiplomacyData() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); 

    const rawAlerts: any[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const titleRegex = /<title>([\s\S]*?)<\/title>/;
    const pubDateRegex = /<pubDate>([\s\S]*?)<\/pubDate>/;

    // 🥊 第一回合：抓取 Google News
    try {
      const queryGoogle = encodeURIComponent('"旅遊警示" ("陸委會" OR "外交部") ("中國" OR "大陸" OR "港澳" OR "台灣")');
      const urlGoogle = `https://news.google.com/rss/search?q=${queryGoogle}&hl=zh-TW&gl=TW&ceid=TW:zh-Hant`;
      const resGoogle = await fetch(urlGoogle, { signal: controller.signal, cache: 'no-store' });
      
      if (resGoogle.ok) {
        const xmlGoogle = await resGoogle.text();
        let matchG;
        while ((matchG = itemRegex.exec(xmlGoogle)) !== null) {
          const titleMatch = titleRegex.exec(matchG[1]);
          if (titleMatch) {
            let title = titleMatch[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim();
            title = title.replace(/\s*[-|｜_]\s*[^-|｜_]+$/, ''); // 砍媒體名
            title = title.replace(/[\.…]+$/, '').trim(); // 砍刪節號
            rawAlerts.push({
              source: "Google",
              title: `[G] ${title}`,
              publishedAt: pubDateRegex.exec(matchG[1])?.[1] || new Date().toISOString()
            });
          }
        }
      }
    } catch (e) {
      console.warn("Google News 抓取失敗", e);
    }

    // 🥊 第二回合：抓取 Bing News
    try {
      const queryBing = encodeURIComponent('"旅遊警示" ("陸委會" OR "外交部")');
      const urlBing = `https://www.bing.com/news/search?q=${queryBing}&format=rss`;
      const resBing = await fetch(urlBing, { signal: controller.signal, cache: 'no-store' });
      
      if (resBing.ok) {
        const xmlBing = await resBing.text();
        let matchB;
        while ((matchB = itemRegex.exec(xmlBing)) !== null) {
          const titleMatch = titleRegex.exec(matchB[1]);
          if (titleMatch) {
            let title = titleMatch[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim();
            title = title.replace(/\s*[-|｜_]\s*[^-|｜_]+$/, '');
            title = title.replace(/[\.…]+$/, '').trim();
            rawAlerts.push({
              source: "Bing",
              title: `[B] ${title}`,
              publishedAt: pubDateRegex.exec(matchB[1])?.[1] || new Date().toISOString()
            });
          }
        }
      }
    } catch (e) {
      console.warn("Bing News 抓取失敗", e);
    }

    clearTimeout(timeoutId);

    // ⚔️ 雙重過濾：排除雜訊，只留紅橙黃
    const negativeRegex = /(中東|以色列|巴林|黎巴嫩|伊朗|加薩|遊戲|娛樂|動漫|電競|影劇|手遊|虛擬|真人版|航海王|演唱會|賽季|抽卡|粉絲|明星|八卦|網紅)/;
    const filteredAlerts = rawAlerts.filter((item: any) => {
      if (negativeRegex.test(item.title)) return false; 
      return (item.title.includes("紅色") || item.title.includes("橙色") || item.title.includes("黃色"));
    });

    if (filteredAlerts.length === 0) {
      return [{ id: 1, country: "兩岸與周邊", flag: "🌍", status: "無近期重大旅遊警示", level: "normal", time: new Date().toLocaleTimeString("zh-TW", { timeZone: 'Asia/Taipei', hour: "2-digit", minute: "2-digit" }) }];
    }

    // 🏆 提取對決陣容：Google 取前 3 名，Bing 取前 3 名，放入同一個舞台
    const googleItems = filteredAlerts.filter(i => i.source === "Google").slice(0, 3);
    const bingItems = filteredAlerts.filter(i => i.source === "Bing").slice(0, 3);
    const combinedItems = [...googleItems, ...bingItems];

    // UI 合約封裝
    return combinedItems.map((item: any, index: number) => {
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
        country: item.title, // 這裡會顯示 [G] 或 [B] 開頭的標題
        flag: flagIcon,
        status: statusText,
        level: uiLevel,
        time: timeStr 
      };
    });

  } catch (error) {
    console.error("❌ 外交爬蟲發生錯誤:", error);
    return [{ id: 1, country: "連線異常", flag: "📡", status: "無法代理取得官方資料", level: "normal", time: "--" }];
  }
}
