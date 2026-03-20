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
    let count = 0;

    while ((match = itemRegex.exec(xmlString)) !== null && count < 3) {
      const itemXml = match[1];
      const titleMatch = titleRegex.exec(itemXml);
      const dateMatch = pubDateRegex.exec(itemXml);

      const titleText = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim() : "無標題";
      const dateText = dateMatch ? new Date(dateMatch[1]).toLocaleTimeString("zh-TW", { timeZone: 'Asia/Taipei', month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "近期";

      let sorties = 0;
      let crossed = 0;

      // 1. 總架次：抓取常規的「XX架次」、「XX機艦」
      const sortiesMatch = titleText.match(/(\d+)\s*(?:架次|架機|機|艦)/);
      if (sortiesMatch) sorties = parseInt(sortiesMatch[1]);

      // 2. 越線架次：🚨 零妥協「絕對貼身防守」
      // 模式 A (數字在前)：精準狙擊「24架越中線」、「5架次逾越」 (限制數字跟「越」之間不能超過 5 個字元)
      const crossedMatchA = titleText.match(/(\d+)\s*(?:架|架次|架機)[^\d]{0,5}(?:越|逾越)/);
      // 模式 B (文字在前)：精準狙擊「逾越中線10架次」
      const crossedMatchB = titleText.match(/(?:逾越|越過|越中線|擾台)[^\d]{0,10}(\d+)\s*(?:架|架次|架機)/);

      if (crossedMatchA) {
        crossed = parseInt(crossedMatchA[1]);
      } else if (crossedMatchB) {
        crossed = parseInt(crossedMatchB[1]);
      }

      // 合理性防呆：如果越線比總數多，且總數不為 0，通常是標題截斷造成的誤判
      if (sorties > 0 && crossed > sorties) crossed = 0;

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
