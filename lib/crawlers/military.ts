// 檔案：lib/crawlers/military.ts

export async function fetchMilitaryData() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); 

    // ⚔️ 透過 Google News 代理搜尋，鎖定國防部的官方通報
    const query = encodeURIComponent('"國防部" ("共機" OR "機艦" OR "擾台" OR "架次")');
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

      // 1. 捕捉總架次 (例如：偵獲12共機、中共23機艦、33架次)
      const sortiesMatch1 = titleText.match(/(?:偵獲|中共|共軍|計有)[^\d]*(\d+)[^\d]*(?:共機|機艦|架次|架機)/);
      const sortiesMatch2 = titleText.match(/(\d+)\s*架次/);
      if (sortiesMatch1) sorties = parseInt(sortiesMatch1[1]);
      else if (sortiesMatch2) sorties = parseInt(sortiesMatch2[1]);

      // 2. 捕捉越線架次 (例如：逾越中線10架次、進入西南空域5共機)
      const crossedMatch = titleText.match(/(?:逾越|越過|進入|擾台)[^\d]*(\d+)[^\d]*(?:架次|共機|架機)/);
      if (crossedMatch) crossed = parseInt(crossedMatch[1]);

      // 如果有抓到任何數字，或是標題有軍演，才視為有效情報
      if (sorties > 0 || crossed > 0 || /(實彈|演習|軍演|聯合戰備)/.test(titleText)) {
        items.push({
          id: count + 1,
          date: dateText,
          title: titleText,
          sorties: sorties,
          crossed: crossed,
          isDrill: /(實彈|演習|軍演|聯合戰備)/.test(titleText),
          desc: "國防部發布最新共軍台海周邊海空域動態。詳情請參閱完整報導或國防部官網。"
        });
        count++;
      }
    }

    if (items.length === 0) {
        return [{ id: 1, date: new Date().toLocaleTimeString("zh-TW", { timeZone: 'Asia/Taipei', hour: "2-digit", minute: "2-digit" }), title: "近期無具體數字之軍事動態", sorties: 0, crossed: 0, isDrill: false, desc: "近期並未偵測到包含具體架次之共機動態通報。" }];
    }

    return items;

  } catch (error: any) {
    console.error("❌ 軍事爬蟲發生錯誤:", error.message || error);
    return [{ id: 1, date: "--", title: "戰術資料連線異常", sorties: 0, crossed: 0, isDrill: false, desc: "無法取得即時軍事動態，可能受防火牆影響。" }];
  }
}
