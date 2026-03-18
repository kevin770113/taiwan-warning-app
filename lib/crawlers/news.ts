// 檔案：lib/crawlers/news.ts

export async function fetchNewsData() {
  try {
    const controller = new AbortController();
    // 為了容忍 4 個請求同時發出，把 Timeout 稍微拉長一點到 8 秒
    const timeoutId = setTimeout(() => controller.abort(), 8000); 

    const apiKey = process.env.NEWS_API_KEY; 
    if (!apiKey) {
      clearTimeout(timeoutId);
      return [{ id: 1, source: "系統警告", time: "剛剛", title: "尚未設定新聞 API 金鑰", snippet: "請設定 NEWS_API_KEY 環境變數。" }];
    }

    // 🌟 第一階段：4 併發寬鬆抓取 (避開複雜 OR 語法導致 API 當機)
    const queries = ["台灣", "中國", "兩岸", "台海"];
    
    const fetchPromises = queries.map(q => {
      const encodedQ = encodeURIComponent(q);
      // 拔掉 sortby，避免 GNews 免費版報錯，單純抓最新關聯的 10 筆
      const url = `https://gnews.io/api/v4/search?q=${encodedQ}&lang=zh&max=10&apikey=${apiKey}`;
      return fetch(url, { signal: controller.signal, next: { revalidate: 600 } }).then(res => {
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return res.json();
      });
    });

    // 等待所有請求完成 (使用 allSettled 確保就算某個關鍵字壞了，其他的還能活著)
    const results = await Promise.allSettled(fetchPromises);
    clearTimeout(timeoutId);

    // 收集所有成功抓到的新聞
    let allArticles: any[] = [];
    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value.articles) {
        allArticles = allArticles.concat(result.value.articles);
      }
    });

    if (allArticles.length === 0) {
        return [{ id: 1, source: "系統回報", time: new Date().toLocaleTimeString("zh-TW", { timeZone: 'Asia/Taipei', hour: "2-digit", minute: "2-digit" }), title: "目前無台海相關新聞", snippet: "API 未回傳任何基礎資料，或連線遭拒。" }];
    }

    // 🌟 第二階段：網址去重複 (Deduplication)
    const uniqueArticlesMap = new Map();
    allArticles.forEach(article => {
      if (article.url && !uniqueArticlesMap.has(article.url)) {
        uniqueArticlesMap.set(article.url, article);
      }
    });
    const uniqueArticles = Array.from(uniqueArticlesMap.values());

    // 🌟 第三階段：程式碼嚴格審查 (Post-processing)
    const positiveRegex = /(台海|兩岸|國防|國軍|共軍|軍演|外交|地緣政治|解放軍|國安|軍事|戰機|艦艇|中共)/;
    const negativeRegex = /(遊戲|娛樂|動漫|電競|影劇|手遊|虛擬|真人版|航海王|抽卡|粉絲|明星|八卦|網紅|實況|長江存儲|消費級|體育|職棒|職籃|演唱會)/;

    const filteredArticles = uniqueArticles.filter(article => {
      const contentToSearch = (article.title + " " + (article.description || "")).toLowerCase();
      if (negativeRegex.test(contentToSearch)) return false; // 踩到地雷直接丟棄
      if (positiveRegex.test(contentToSearch)) return true;  // 符合條件保留
      return false;
    });

    if (filteredArticles.length === 0) {
        return [{ id: 1, source: "系統過濾", time: new Date().toLocaleTimeString("zh-TW", { timeZone: 'Asia/Taipei', hour: "2-digit", minute: "2-digit" }), title: "無重大政經軍事新聞", snippet: "已排除娛樂與無關訊息，從近期資料庫中未發現值得警戒的局勢新聞。" }];
    }

    // 🌟 第四階段：手動按時間排序 (越新的排越前面)
    filteredArticles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    return filteredArticles.slice(0, 3).map((article: any, index: number) => ({
      id: index + 1,
      source: article.source.name || "國際新聞",
      // 強制寫入台灣時區
      time: new Date(article.publishedAt).toLocaleTimeString("zh-TW", { timeZone: 'Asia/Taipei', month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
      title: article.title,
      snippet: article.description || "無摘要",
      url: article.url 
    }));

  } catch (error) {
    console.error("❌ 新聞爬蟲發生錯誤:", error);
    return [{ id: 1, source: "連線異常", time: new Date().toLocaleTimeString("zh-TW", { timeZone: 'Asia/Taipei', hour: "2-digit", minute: "2-digit" }), title: "無法取得即時新聞", snippet: "由於網路異常或連線超時，目前無法取得即時新聞。請稍後重試。" }];
  }
}
