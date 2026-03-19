// 檔案：lib/crawlers/military.ts

export async function fetchMilitaryData() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); 

    // ⚔️ 利用強大的代理搜尋引擎
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
    let count = 0;

    while ((match = itemRegex.exec(xmlString)) !== null && count < 3) {
      const itemXml = match[1];
      const titleMatch = titleRegex.exec(itemXml);
      const dateMatch = pubDateRegex.exec(itemXml);

      const titleText = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim() : "無標題";
      const dateText = dateMatch ? new Date(dateMatch[1]).toLocaleTimeString("zh-TW", { timeZone: 'Asia/Taipei', month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "近期";

      // 🚨 戰術提煉 v2.0：多重條件捕捉 (容錯率極高)
      let sorties = 0;
      let crossed = 0;

      // 1. 捕捉總架次 (例如：偵獲12共機、33架次、中共23機艦)
      const sortiesMatch = titleText.match(/(\d+)\s*[架機]/); // 直接找「架」或「機艦」前面的數字
      if (sortiesMatch) sorties = parseInt(sortiesMatch[1]);

      // 2. 捕捉越線架次 (🚨 零妥協進化版：精準狙擊「24架越中線」這類格式)
      // 模式 A：逾越中線10架次、扰台12共機
      const crossedMatchA = titleText.match(/(?:逾越|扰台)[^\d]*(\d+)[^\d]*架/); 
      // 模式 B：(🚨 終極突破)：24架越中線、3架機越線
      const crossedMatchB = titleText.match(/(\d+)\s*[架機][^>]*越/);

      if (crossedMatchA) crossed = parseInt(crossedMatchA[1]);
      else if (crossedMatchB) crossed = parseInt(crossedMatchB[1]); // 優先級最高
      
      // 容錯機制：如果兩者都匹配到同個數字，可能是標題截斷導致，此時 crossed 為 0 或 sorties
      if (sorties > 0 && crossed > sorties) crossed = 0; // 邏輯檢查

      // 如果抓到任何數字，才視為有效情報
      if (sorties > 0 || crossed > 0 || /(實彈|演習|軍演|聯合戰備)/.test(titleText)) {
        items.push({
          id: count + 1,
          date: dateText,
          title: titleText,
          sorties: sorties,
          crossed: crossed,
          isDrill: /(實彈|演習|軍演|聯合戰備)/.test(titleText),
          desc: "國防部周邊海空域動態。詳情請參閱完整報導。"
        });
        count++;
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
