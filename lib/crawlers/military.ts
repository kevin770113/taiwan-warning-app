// 檔案：lib/crawlers/military.ts

export async function fetchMilitaryData() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); 

    // ⚔️ 零妥協戰術：透過 Google News 代理搜尋，徹底繞過國防部 WAF 封鎖
    // 強制搜尋必須同時包含「國防部」、「共機」、「架次」的新聞
    const query = encodeURIComponent('"國防部" "共機" "架次"');
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

    // 解析前 3 筆最新的戰術通報
    while ((match = itemRegex.exec(xmlString)) !== null && count < 3) {
      const itemXml = match[1];
      const titleMatch = titleRegex.exec(itemXml);
      const dateMatch = pubDateRegex.exec(itemXml);

      const titleText = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim() : "無標題";
      const dateText = dateMatch ? new Date(dateMatch[1]).toLocaleTimeString("zh-TW", { timeZone: 'Asia/Taipei', month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "近期";

      // 🚨 戰術提煉：使用正則表達式，直接從新聞標題中把「架次」數字給挖出來
      const sortiesMatch = titleText.match(/(\d+)\s*架次/);
      const crossedMatch = titleText.match(/(?:逾越|越過|進入|擾台).*?(\d+)\s*架次/);

      items.push({
        id: count + 1,
        date: dateText,
        title: titleText,
        sorties: sortiesMatch ? parseInt(sortiesMatch[1]) : 0, // 挖出總架次
        crossed: crossedMatch ? parseInt(crossedMatch[1]) : 0, // 挖出越線架次
        isDrill: /(實彈|演習|軍演|聯合戰備)/.test(titleText),
        desc: "國防部發布最新共軍台海周邊海空域動態。詳情請參閱完整報導或國防部官網。"
      });
      count++;
    }

    if (items.length === 0) {
        return [{ id: 1, date: new Date().toLocaleTimeString("zh-TW", { timeZone: 'Asia/Taipei', hour: "2-digit", minute: "2-digit" }), title: "近期無重大軍事動態", sorties: 0, crossed: 0, isDrill: false, desc: "近期並未偵測到包含具體架次之共機動態通報。" }];
    }

    return items;

  } catch (error: any) {
    console.error("❌ 軍事爬蟲發生錯誤:", error.message || error);
    return [{ id: 1, date: "--", title: "戰術資料連線異常", sorties: 0, crossed: 0, isDrill: false, desc: "無法取得即時軍事動態，可能受防火牆影響。" }];
  }
}
