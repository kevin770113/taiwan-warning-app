// 檔案：lib/crawlers/news.ts

export async function fetchNewsData() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); 

    // 🌟 全新引擎：Google News RSS (免金鑰、無額度限制、繁體中文精準)
    // 我們給 Google 充足的關鍵字，讓它去全台灣的媒體庫裡撈出幾十篇新聞
    const query = encodeURIComponent('台海 OR 兩岸 OR 共軍 OR 國軍 OR 國防部');
    const url = `https://news.google.com/rss/search?q=${query}&hl=zh-TW&gl=TW&ceid=TW:zh-Hant`;
    
    // 依然保持無快取，方便我們除錯
    const res = await fetch(url, { signal: controller.signal, cache: 'no-store' }); 
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    
    const xmlString = await res.text();
    clearTimeout(timeoutId);

    // ⚔️ 原生解析 XML：提取 Google News 的 <item>
    const rawArticles: any[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const titleRegex = /<title>([\s\S]*?)<\/title>/;
    const pubDateRegex = /<pubDate>([\s\S]*?)<\/pubDate>/;
    const sourceRegex = /<source[^>]*>([\s\S]*?)<\/source>/;
    const linkRegex = /<link>([\s\S]*?)<\/link>/;

    let match;
    // 限制最多解析前 40 筆進行樣本測試
    while ((match = itemRegex.exec(xmlString)) !== null && rawArticles.length < 40) {
      const itemXml = match[1];
      const titleMatch = titleRegex.exec(itemXml);
      const dateMatch = pubDateRegex.exec(itemXml);
      const sourceMatch = sourceRegex.exec(itemXml);
      const linkMatch = linkRegex.exec(itemXml);

      if (titleMatch) {
        rawArticles.push({
          title: titleMatch[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim(),
          sourceName: sourceMatch ? sourceMatch[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim() : "Google 新聞",
          publishedAt: dateMatch ? dateMatch[1] : new Date().toISOString(),
          url: linkMatch ? linkMatch[1] : "",
          description: "" // Google RSS 的 description 通常是一坨 HTML，我們這裡依靠標題就足夠強大
        });
      }
    }

    const debugLogs = [];

    // 🕵️‍♂️ [除錯階段一：原始抓取]
    debugLogs.push({
      id: 901,
      source: "除錯：階段一 (Google RSS回傳)",
      time: new Date().toLocaleTimeString("zh-TW", { timeZone: 'Asia/Taipei', hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      title: `大樣本抓取數量：${rawArticles.length} 篇`,
      snippet: rawArticles.length > 0 ? `前5篇預覽：${rawArticles.slice(0,5).map(a => a.title).join(" ｜ ")}` : "Google News 回傳異常。"
    });

    // 🕵️‍♂️ [除錯階段二：負面詞排除]
    const negativeRegex = /(遊戲|娛樂|動漫|電競|影劇|手遊|虛擬|真人版|航海王|抽卡|粉絲|明星|八卦|網紅|實況|長江存儲|消費級|體育|職棒|職籃|演唱會)/;
    const afterNegative = rawArticles.filter((article: any) => {
      const contentToSearch = article.title.toLowerCase();
      return !negativeRegex.test(contentToSearch);
    });

    debugLogs.push({
      id: 902,
      source: "除錯：階段二 (負面過濾)",
      time: "系統分析中",
      title: `排除娛樂廢文後剩餘：${afterNegative.length} 篇`,
      snippet: `剔除了 ${rawArticles.length - afterNegative.length} 篇可能踩雷的新聞。`
    });

    // 🕵️‍♂️ [除錯階段三：正面詞確認]
    const positiveRegex = /(台海|兩岸|國防|國軍|共軍|軍演|外交|地緣政治|解放軍|國安|軍事|戰機|艦艇|中共)/;
    const finalArticles = afterNegative.filter((article: any) => {
      const contentToSearch = article.title.toLowerCase();
      return positiveRegex.test(contentToSearch);
    });

    debugLogs.push({
      id: 903,
      source: "除錯：階段三 (正面確認)",
      time: "系統分析中",
      title: `含軍政關鍵字最終剩餘：${finalArticles.length} 篇`,
      snippet: finalArticles.length > 0 ? `最終存活預覽：${finalArticles.slice(0,5).map(a => a.title).join(" ｜ ")}` : "全軍覆沒。"
    });

    // 🌟 最終結果轉換 (取前 3 筆最新/最相關的新聞給 UI)
    const formattedResults = finalArticles.slice(0, 3).map((article: any, index: number) => {
      const pubDate = new Date(article.publishedAt);
      const timeString = isNaN(pubDate.getTime()) 
        ? "近期" 
        : pubDate.toLocaleTimeString("zh-TW", { timeZone: 'Asia/Taipei', month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

      return {
        id: index + 1,
        source: article.sourceName,
        time: timeString,
        title: article.title,
        snippet: "點擊閱讀完整報導以獲取最新台海局勢分析。", // RSS 沒有乾淨摘要，我們給一個引導句
        url: article.url 
      };
    });

    return [...debugLogs, ...formattedResults];

  } catch (error) {
    console.error("❌ 新聞爬蟲發生錯誤:", error);
    return [{ id: 1, source: "連線異常", time: new Date().toLocaleTimeString("zh-TW", { timeZone: 'Asia/Taipei', hour: "2-digit", minute: "2-digit", second: "2-digit" }), title: "無法取得即時新聞", snippet: "解析 Google News 發生異常。" }];
  }
}
