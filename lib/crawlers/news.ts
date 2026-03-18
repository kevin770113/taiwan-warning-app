// 檔案：lib/crawlers/news.ts

export async function fetchNewsData() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); 

    const apiKey = process.env.NEWS_API_KEY; 
    if (!apiKey) {
      clearTimeout(timeoutId);
      return [{ id: 1, source: "系統警告", time: "剛剛", title: "尚未設定新聞 API 金鑰", snippet: "請設定 NEWS_API_KEY 環境變數。" }];
    }

    // 🌟 終極修復：拔掉導致 Bug 的雙引號，擴充國安關鍵字
    const query = encodeURIComponent('台海 OR 兩岸 OR 解放軍 OR 國軍');
    
    // 🌟 加上 &sortby=publishedAt 強制抓取「最新發布」的新聞
    const url = `https://gnews.io/api/v4/search?q=${query}&lang=zh&max=3&sortby=publishedAt&apikey=${apiKey}`;
    
    const res = await fetch(url, { signal: controller.signal, next: { revalidate: 600 } });
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    
    const data = await res.json();
    clearTimeout(timeoutId);

    if (!data.articles || data.articles.length === 0) {
        return [{ id: 1, source: "系統回報", time: new Date().toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" }), title: "目前無重大台海新聞", snippet: "過去 30 天內，並未搜尋到符合國安關鍵字的重大新聞。" }];
    }

    return data.articles.map((article: any, index: number) => ({
      id: index + 1,
      source: article.source.name || "國際新聞",
      time: new Date(article.publishedAt).toLocaleTimeString("zh-TW", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
      title: article.title,
      snippet: article.description || "無摘要",
      url: article.url 
    }));
  } catch (error) {
    console.error("❌ 新聞爬蟲發生錯誤:", error);
    return [{ id: 1, source: "連線異常", time: "--", title: "無法取得即時新聞", snippet: "連線超時，請稍後重試。" }];
  }
}
