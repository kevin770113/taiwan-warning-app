// 檔案：lib/crawlers/diplomacy.ts

export async function fetchDiplomacyData() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); 

    const rawAlerts: any[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const titleRegex = /<title>([\s\S]*?)<\/title>/;
    const pubDateRegex = /<pubDate>([\s\S]*?)<\/pubDate>/;

    // 🚀 戰略一：直搗黃龍！透過 AllOrigins 代理，直接向外交部官方要完整 RSS
    const bocaRssUrl = 'https://www.boca.gov.tw/sp-trwa-rss-1.html';
    const proxyBocaUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(bocaRssUrl)}`;
    
    // 暴力破除快取，保證拿最新官方資料
    const resBoca = await fetch(proxyBocaUrl, { signal: controller.signal, cache: 'no-store' }); 
    
    if (resBoca.ok) {
      const xmlBoca = await resBoca.text();
      let matchBoca;
      while ((matchBoca = itemRegex.exec(xmlBoca)) !== null) {
        const itemXml = matchBoca[1];
        const titleMatch = titleRegex.exec(itemXml);
        if (titleMatch) {
          // 官方 RSS 標題非常乾淨且絕不截斷，直接收錄！
          rawAlerts.push({
            title: titleMatch[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim(),
            publishedAt: pubDateRegex.exec(itemXml)?.[1] || new Date().toISOString()
          });
        }
      }
    }

    // 🚀 戰略一 (擴充)：外交部不含中國港澳，我們用代理發動第二路抓取陸委會最新動態 (使用不愛截斷的 Bing News)
    const macSearchUrl = 'https://www.bing.com/news/search?q="旅遊警示"+"陸委會"&format=rss';
    const proxyMacUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(macSearchUrl)}`;

    try {
      const resMac = await fetch(proxyMacUrl, { cache: 'no-store' });
      if (resMac.ok) {
        const xmlMac = await resMac.text();
        let matchMac;
        while ((matchMac = itemRegex.exec(xmlMac)) !== null) {
          const macTitleMatch = titleRegex.exec(matchMac[1]);
          if (macTitleMatch) {
            let macTitle = macTitleMatch[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim();
            macTitle = macTitle.replace(/\s*[-|｜_]\s*[^-|｜_]+$/, ''); // 砍掉媒體尾巴
            rawAlerts.push({
              title: macTitle,
              publishedAt: pubDateRegex.exec(matchMac[1])?.[1] || new Date().toISOString()
            });
          }
        }
      }
    } catch (e) {
      console.warn("陸委會輔助抓取失敗，但外交部資料不受影響", e);
    }

    clearTimeout(timeoutId);

    // ⚔️ 過濾條件：保留紅色、橙色、黃色，並排除娛樂雜訊
    const negativeRegex = /(遊戲|娛樂|動漫|電競|影劇|手遊|虛擬|真人版|航海王|演唱會|賽季|抽卡|粉絲|明星|八卦|網紅)/;
    const filteredAlerts = rawAlerts.filter((item: any) => {
      const t = item.title;
      if (negativeRegex.test(t)) return false; 
      return (t.includes("紅色") || t.includes("橙色") || t.includes("黃色"));
    });

    if (filteredAlerts.length === 0) {
      return [{ id: 1, country: "兩岸與全球", flag: "🌍", status: "無近期重大旅遊警示", level: "normal", time: new Date().toLocaleTimeString("zh-TW", { timeZone: 'Asia/Taipei', hour: "2-digit", minute: "2-digit" }) }];
    }

    // 取前 4 筆，並進行嚴格的狀態解耦
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

      // 提取官方標題中的國家名稱 (通常格式如：【紅色警示】以色列)
      let displayCountry = item.title;
      const extractMatch = item.title.match(/(?:】|\]|\s|^)([^\s【】\[\]\-]+)\s*(?:\(|（|\-|紅色|橙色|黃色)/);
      if (extractMatch && extractMatch[1]) {
         displayCountry = extractMatch[1]; // 盡量只顯示乾淨的國家名
      }

      return {
        id: index + 1,
        // 如果提取失敗，就直接顯示官方的一字不漏完整標題
        country: displayCountry.length > 3 ? displayCountry : item.title, 
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
