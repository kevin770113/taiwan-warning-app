// 檔案：lib/crawlers/military.ts

export async function fetchMilitaryData() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 秒防禦

    // 嘗試抓取國防部全球資訊網 RSS (XML)
    // ⚠️ 現實警告：國防部伺服器有極高機率阻擋海外雲端 IP (如 Vercel)
    const url = "https://www.mnd.gov.tw/rss.aspx";

    const res = await fetch(url, {
      signal: controller.signal,
      next: { revalidate: 600 }, // 快取 10 分鐘
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TaiwanWarningApp/1.0)' // 嘗試加上 UA 減少被擋機率
      }
    });

    if (!res.ok) {
      throw new Error(`HTTP Error: ${res.status} (國防部伺服器拒絕連線或阻擋 IP)`);
    }

    const xmlString = await res.text();
    clearTimeout(timeoutId);

    // ⚔️ 原生解析 XML：使用正則表達式提取 <item>
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const titleRegex = /<title>([\s\S]*?)<\/title>/;
    const descRegex = /<description>([\s\S]*?)<\/description>/;
    const pubDateRegex = /<pubDate>([\s\S]*?)<\/pubDate>/;

    let match;
    let count = 0;

    // 掃描 RSS 內容，最多取 3 筆符合條件的資料
    while ((match = itemRegex.exec(xmlString)) !== null && count < 3) {
      const itemXml = match[1];
      const titleMatch = titleRegex.exec(itemXml);
      const descMatch = descRegex.exec(itemXml);
      const dateMatch = pubDateRegex.exec(itemXml);

      const titleText = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim() : "無標題";
      const descText = descMatch ? descMatch[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim() : "無內容";
      const dateText = dateMatch ? new Date(dateMatch[1]).toLocaleTimeString("zh-TW", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "近期";

      // 🚨 真實過濾：只有標題或內文包含特定國安關鍵字才納入，避免抓到無關的新聞
      if (!/(軍事|共機|共艦|空域|海域|越中線|戰備)/.test(titleText) && !/(軍事|共機|共艦|空域|海域|越中線)/.test(descText)) {
        continue;
      }

      // 嘗試提取架次數字 (容錯處理，抓不到就回報 0)
      const sortiesMatch = descText.match(/(\d+)\s*架次/);
      const crossedMatch = descText.match(/(?:逾越|越過|進入).*?(\d+)\s*架次/);

      items.push({
        id: count + 1,
        date: dateText,
        title: titleText,
        sorties: sortiesMatch ? parseInt(sortiesMatch[1]) : 0,
        crossed: crossedMatch ? parseInt(crossedMatch[1]) : 0,
        isDrill: /(實彈|演習|軍演)/.test(descText),
        desc: descText.substring(0, 100) + (descText.length > 100 ? "..." : "")
      });
      count++;
    }

    // 如果解析成功，但近期真的沒有軍事動態
    if (items.length === 0) {
        return [{
            id: 1,
            date: new Date().toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" }),
            title: "近期無重大軍事動態",
            sorties: 0,
            crossed: 0,
            isDrill: false,
            desc: "國防部最新發布資訊中，未偵測到共機共艦等相關特定關鍵字動態。"
        }];
    }

    return items;

  } catch (error: any) {
    console.error("❌ 軍事爬蟲發生錯誤:", error.message || error);
    // 🛡️ 誠實的錯誤回報：絕對不給假資料！直接告訴使用者連線失敗。
    return [{
       id: 1,
       date: "--",
       title: "國防部資料連線異常",
       sorties: 0,
       crossed: 0,
       isDrill: false,
       desc: "無法直接從海外伺服器取得國防部即時軍事動態 (可能遭受 IP 阻擋或網路超時)。請民眾直接前往國防部全球資訊網查看最新消息。"
    }];
  }
}
