// 檔案：lib/crawlers/military.ts

export async function fetchMilitaryData() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); 

    const query = encodeURIComponent('"國防部" ("共機" OR "擾台" OR "架次" OR "越線")');
    const url = `https://news.google.com/rss/search?q=${query}&hl=zh-TW&gl=TW&ceid=TW:zh-Hant`;

    const res = await fetch(url, { signal: controller.signal, next: { revalidate: 600 } });
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);

    const xmlString = await res.text();
    clearTimeout(timeoutId);

    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const titleRegex = /<title>([\s\S]*?)<\/title>/;
    const pubDateRegex = /<pubDate>([\s\S]*?)<\/pubDate>/;

    let match;
    const seenDates = new Set<string>(); // 🚨 零妥協去重機制：記憶已經收錄過的日期

    // 放寬迴圈尋找範圍，直到收集滿 7 篇「不同日期」的動態為止
    while ((match = itemRegex.exec(xmlString)) !== null && items.length < 7) {
      const itemXml = match[1];
      const titleMatch = titleRegex.exec(itemXml);
      const dateMatch = pubDateRegex.exec(itemXml);

      const titleText = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim() : "無標題";
      
      // 提煉發布時間，並切分出純日期部分 (例如 "3月20日") 用作去重 Key
      const fullDateText = dateMatch ? new Date(dateMatch[1]).toLocaleTimeString("zh-TW", { timeZone: 'Asia/Taipei', month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "近期";
      const dateKey = fullDateText.split(' ')[0]; 

      // 🚨 去重過濾：如果這天已經有一篇新聞了，直接跳過不抓
      if (seenDates.has(dateKey)) continue;

      let sorties = 0;
      let crossed = 0;

      // 1. 總架次
      const sortiesMatch = titleText.match(/(\d+)\s*(?:架次|架機|機|艦)/);
      if (sortiesMatch) sorties = parseInt(sortiesMatch[1]);

      // 2. 越線架次：絕對貼身防守
      const crossedMatchA = titleText.match(/(\d+)\s*(?:架|架次|架機)[^\d]{0,5}(?:越|逾越)/);
      const crossedMatchB = titleText.match(/(?:逾越|越過|越中線|擾台)[^\d]{0,10}(\d+)\s*(?:架|架次|架機)/);

      if (crossedMatchA) crossed = parseInt(crossedMatchA[1]);
      else if (crossedMatchB) crossed = parseInt(crossedMatchB[1]);

      if (sorties > 0 && crossed > sorties) crossed = 0;

      // 必須有具體數據，或是重大軍演
      if (sorties > 0 || crossed > 0 || /(實彈|演習|軍演|聯合戰備)/.test(titleText)) {
        items.push({
          id: items.length + 1,
          date: fullDateText,
          title: titleText,
          sorties: sorties,
          crossed: crossed,
          isDrill: /(實彈|演習|軍演|聯合戰備)/.test(titleText),
          desc: "國防部周邊海空域動態。詳情請參閱完整報導。"
        });
        
        // 成功收錄後，將這個日期加入黑名單，當天後續的新聞全數跳過
        seenDates.add(dateKey);
      }
    }

    if (items.length === 0) {
        return [{ id: 1, date: new Date().toLocaleTimeString("zh-TW", { timeZone: 'Asia/Taipei', hour: "2-digit", minute: "2-digit" }), title: "近期無具體架次之擾台動態", sorties: 0, crossed: 0, isDrill: false, desc: "近期並未偵測到包含具體架次之共機擾台通報。" }];
    }

    return items;

  } catch (error: any) {
    console.error("❌ 軍事爬蟲發生錯誤:", error.message || error);
    return [{ id: 1, date: "--", title: "資料提煉連線異常", sorties: 0, crossed: 0, isDrill: false, desc: "無法連線至代理搜尋引擎，可能受防火牆影響。" }];
  }
}
