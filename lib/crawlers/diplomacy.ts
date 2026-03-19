// 檔案：lib/crawlers/diplomacy.ts

export async function fetchDiplomacyData() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); 

    // 🤝 零妥協情報代理突破：透過 Google News RSS 精準抓取官方旅遊警示公告
    // 拔掉硬編碼的「中東」，鎖定外交部官方通報
    const query = encodeURIComponent('"外交部" "旅遊警示" ("美國" OR "日本" OR "英國" OR "台灣" OR "中國")');
    const url = `https://news.google.com/rss/search?q=${query}&hl=zh-TW&gl=TW&ceid=TW:zh-Hant`;
    
    // 依然設定 1 小時快取
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

    // ⚔️ 零妥協雙層過濾 (Post-processing)
    // 負面詞：一票否決
    const negativeRegex = /(遊戲|娛樂|動漫|電競|影劇|手遊|虛擬|真人版|航海王|演唱會|賽季|抽卡|粉絲|明星|八卦|網紅|實況|長江存儲|消費級)/;
    // 正面詞：必須包含關鍵國家或地點
    const positiveRegex = /(美國|日本|英國|加拿大|澳洲|歐洲|聯合國|中國|台灣)/;

    const filteredAlerts = rawAlerts.filter((item: any) => {
      const t = item.title;
      if (negativeRegex.test(t)) return false; // 踩到地雷直接丟棄
      // 必須有重大顏色警示
      return (t.includes("紅色") || t.includes("橙色") || t.includes("黃色"));
    });

    if (filteredAlerts.length === 0) {
      return [{ id: 1, country: "全球", flag: "🌍", status: "無重大紅色/橙色旅遊警示", level: "normal", time: new Date().toLocaleTimeString("zh-TW", { timeZone: 'Asia/Taipei', hour: "2-digit", minute: "2-digit" }) }];
    }

    // 取前 4 筆最新警示，轉化為 UI 卡片
    return filteredAlerts.slice(0, 4).map((item: any, index: number) => {
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
        // 直接將標題截斷作為顯示文字 (保留標題最準確)
        country: item.title.length > 20 ? item.title.substring(0, 20) + "..." : item.title,
        flag: uiLevel === "warning" ? "🚫" : "⚠️",
        status: statusText,
        level: uiLevel,
        time: timeStr 
      };
    });

  } catch (error) {
    console.error("❌ 外交爬蟲發生錯誤:", error);
    return [{ id: 1, country: "連線異常", flag: "📡", status: "無法代理取得外交部資料", level: "normal", time: "--" }];
  }
}
