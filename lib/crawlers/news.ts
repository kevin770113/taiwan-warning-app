// 檔案：lib/crawlers/news.ts

export async function fetchNewsData() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 秒防禦

    // 🚨 零妥協驗證：嚴格檢查是否有設定環境變數
    // 在 Vercel 上，這會讀取你剛剛設定的 NEWS_API_KEY
    const apiKey = process.env.NEWS_API_KEY; 
    
    // 如果系統找不到金鑰，誠實回報錯誤，絕對不提供假資料墊檔！
    if (!apiKey) {
      clearTimeout(timeoutId);
      return [
        { 
          id: 1, 
          source: "系統警告", 
          time: "剛剛", 
          title: "尚未設定新聞 API 金鑰", 
          snippet: "開發者注意：系統無法取得即時新聞。請在 Vercel 後台或本地端的 .env.local 檔案中設定 NEWS_API_KEY 環境變數。" 
        }
      ];
    }

    // 真實呼叫 GNews API (搜尋台海相關新聞，取最新 3 筆)
    const url = `https://gnews.io/api/v4/search?q=台海&lang=zh&max=3&apikey=${apiKey}`;
    
    // 這裡同樣使用 Vercel 的邊緣快取 (600 秒 = 10 分鐘)
    // 保證一天只會消耗少量的 API 額度，絕不超支！
    const res = await fetch(url, { 
        signal: controller.signal, 
        next: { revalidate: 600 } 
    });
    
    if (!res.ok) throw new Error(`HTTP Error: ${res.status} (新聞 API 拒絕連線或額度耗盡)`);
    
    const data = await res.json();
    clearTimeout(timeoutId);

    // 如果真的沒有台海相關新聞
    if (!data.articles || data.articles.length === 0) {
        return [{
            id: 1,
            source: "系統回報",
            time: new Date().toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" }),
            title: "目前無重大台海新聞",
            snippet: "過去一段時間內，並未搜尋到符合「台海」關鍵字的重大新聞報導。"
        }];
    }

    // 將 GNews 格式轉換成我們 UI 需要的格式
    return data.articles.map((article: any, index: number) => ({
      id: index + 1,
      source: article.source.name || "國際新聞",
      time: new Date(article.publishedAt).toLocaleTimeString("zh-TW", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
      title: article.title,
      snippet: article.description || "無摘要",
    }));

  } catch (error) {
    console.error("❌ 新聞爬蟲發生錯誤:", error);
    // 🛡️ 誠實的錯誤回報：網路中斷或 API 掛掉時，明白告訴使用者
    return [
        { 
          id: 1, 
          source: "連線異常", 
          time: "--", 
          title: "無法取得即時新聞", 
          snippet: "由於網路異常或連線超時，目前無法取得即時新聞。請稍後下拉重新整理。" 
        }
    ];
  }
}
