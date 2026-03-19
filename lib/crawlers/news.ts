// 檔案：lib/crawlers/news.ts

export async function fetchNewsData() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); 

    const apiKey = process.env.NEWS_API_KEY; 
    if (!apiKey) {
      clearTimeout(timeoutId);
      return [{ id: 1, source: "系統警告", time: "剛剛", title: "尚未設定新聞 API 金鑰", snippet: "請設定 NEWS_API_KEY 環境變數。" }];
    }

    // 🌟 修正點 1：拔掉 country=tw，解放搜尋範圍
    // 🌟 修正點 2：加上 &in=title,description，強制搜尋標題與摘要，解決視野落差
    const query = encodeURIComponent('台海 OR 兩岸 OR 共軍 OR 國軍');
    const url = `https://gnews.io/api/v4/search?q=${query}&lang=zh&in=title,description&max=10&apikey=${apiKey}`;
    
    const res = await fetch(url, { signal: controller.signal, next: { revalidate: 0 } }); // 測試期間強制不快取 (revalidate: 0)
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    
    const data = await res.json();
    clearTimeout(timeoutId);

    const rawArticles = data.articles || [];
    const debugLogs = [];

    // 🕵️‍♂️ [除錯階段一：原始抓取]
    debugLogs.push({
      id: 901,
      source: "除錯：階段一 (API回傳)",
      time: new Date().toLocaleTimeString("zh-TW", { timeZone: 'Asia/Taipei', hour: "2-digit", minute: "2-digit" }),
      title: `原始抓取數量：${rawArticles.length} 篇`,
      snippet: rawArticles.length > 0 ? `抓到標題包含：${rawArticles.map((a: any) => a.title).join(" ｜ ")}` : "GNews 回傳空陣列，可能是查詢語法被拒絕。"
    });

    // 🕵️‍♂️ [除錯階段二：負面詞排除]
    const negativeRegex = /(遊戲|娛樂|動漫|電競|影劇|手遊|虛擬|真人版|航海王|抽卡|粉絲|明星|八卦|網紅|實況|長江存儲|消費級|體育|職棒|職籃|演唱會)/;
    const afterNegative = rawArticles.filter((article: any) => {
      const contentToSearch = (article.title + " " + (article.description || "")).toLowerCase();
      return !negativeRegex.test(contentToSearch);
    });

    debugLogs.push({
      id: 902,
      source: "除錯：階段二 (負面過濾)",
      time: "系統分析中",
      title: `排除娛樂廢文後剩餘：${afterNegative.length} 篇`,
      snippet: afterNegative.length > 0 ? `存活標題：${afterNegative.map((a: any) => a.title).join(" ｜ ")}` : "全軍覆沒，所有新聞都踩到負面地雷詞。"
    });

    // 🕵️‍♂️ [除錯階段三：正面詞確認]
    const positiveRegex = /(台海|兩岸|國防|國軍|共軍|軍演|外交|地緣政治|解放軍|國安|軍事|戰機|艦艇|中共)/;
    const finalArticles = afterNegative.filter((article: any) => {
      const contentToSearch = (article.title + " " + (article.description || "")).toLowerCase();
      return positiveRegex.test(contentToSearch);
    });

    debugLogs.push({
      id: 903,
      source: "除錯：階段三 (正面確認)",
      time: "系統分析中",
      title: `確認含軍政關鍵字最終剩餘：${finalArticles.length} 篇`,
      snippet: finalArticles.length > 0 ? `準備輸出給使用者的標題：${finalArticles.map((a: any) => a.title).join(" ｜ ")}` : "全軍覆沒，存活的新聞沒有任何一篇包含正面軍政關鍵字。"
    });

    // 🌟 最終結果轉換
    const formattedResults = finalArticles.slice(0, 3).map((article: any, index: number) => ({
      id: index + 1,
      source: article.source.name || "國內外新聞",
      time: new Date(article.publishedAt).toLocaleTimeString("zh-TW", { timeZone: 'Asia/Taipei', month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
      title: article.title,
      snippet: article.description || "無摘要",
      url: article.url 
    }));

    // 將除錯日誌與最終結果合併回傳給 UI 顯示
    return [...debugLogs, ...formattedResults];

  } catch (error) {
    console.error("❌ 新聞爬蟲發生錯誤:", error);
    return [{ id: 1, source: "連線異常", time: new Date().toLocaleTimeString("zh-TW", { timeZone: 'Asia/Taipei', hour: "2-digit", minute: "2-digit" }), title: "無法取得即時新聞", snippet: "由於網路異常或連線超時，目前無法取得即時新聞。請稍後重試。" }];
  }
}
