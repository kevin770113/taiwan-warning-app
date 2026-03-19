// 檔案：lib/crawlers/news.ts

export async function fetchNewsData() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); 

    const query = encodeURIComponent('台海 OR 兩岸 OR 共軍 OR 國軍 OR 國防部');
    const url = `https://news.google.com/rss/search?q=${query}&hl=zh-TW&gl=TW&ceid=TW:zh-Hant`;
    
    // 恢復 Vercel 原生快取機制
    const res = await fetch(url, { signal: controller.signal, next: { revalidate: 600 } }); 
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    
    const xmlString = await res.text();
    clearTimeout(timeoutId);

    const rawArticles: any[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const titleRegex = /<title>([\s\S]*?)<\/title>/;
    const pubDateRegex = /<pubDate>([\s\S]*?)<\/pubDate>/;
    const sourceRegex = /<source[^>]*>([\s\S]*?)<\/source>/;
    const linkRegex = /<link>([\s\S]*?)<\/link>/;

    let match;
    while ((match = itemRegex.exec(xmlString)) !== null && rawArticles.length < 40) {
      const itemXml = match[1];
      const titleMatch = titleRegex.exec(itemXml);
      if (titleMatch) {
        rawArticles.push({
          title: titleMatch[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim(),
          sourceName: (sourceRegex.exec(itemXml)?.[1] || "Google 新聞").replace(/<!\[CDATA\[|\]\]>/g, "").trim(),
          publishedAt: pubDateRegex.exec(itemXml)?.[1] || new Date().toISOString(),
          url: linkRegex.exec(itemXml)?.[1] || "",
        });
      }
    }

    const negativeRegex = /(遊戲|娛樂|動漫|電競|影劇|手遊|虛擬|真人版|航海王|抽卡|粉絲|明星|八卦|網紅|實況|長江存儲|消費級|體育|職棒|職籃|演唱會|賽季)/;
    const positiveRegex = /(台海|兩岸|國防|國軍|共軍|軍演|外交|地緣政治|解放軍|國安|軍事|戰機|艦艇|中共)/;

    const finalArticles = rawArticles.filter((article: any) => {
      const contentToSearch = article.title.toLowerCase();
      return !negativeRegex.test(contentToSearch) && positiveRegex.test(contentToSearch);
    });

    if (finalArticles.length === 0) {
        return [{ id: 1, source: "系統回報", time: new Date().toLocaleTimeString("zh-TW", { timeZone: 'Asia/Taipei', hour: "2-digit", minute: "2-digit" }), title: "目前無重大台海新聞", snippet: "近期並未偵測到值得警戒的局勢新聞。" }];
    }

    return finalArticles.slice(0, 3).map((article: any, index: number) => {
      const pubDate = new Date(article.publishedAt);
      return {
        id: index + 1,
        source: article.sourceName,
        time: isNaN(pubDate.getTime()) ? "近期" : pubDate.toLocaleTimeString("zh-TW", { timeZone: 'Asia/Taipei', month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
        title: article.title,
        snippet: "點擊閱讀完整報導以獲取最新台海局勢分析。",
        url: article.url 
      };
    });

  } catch (error) {
    console.error("❌ 新聞爬蟲發生錯誤:", error);
    return [{ id: 1, source: "連線異常", time: "--", title: "無法取得即時新聞", snippet: "解析引擎發生異常，請稍後重試。" }];
  }
}
