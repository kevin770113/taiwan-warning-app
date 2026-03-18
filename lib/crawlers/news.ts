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

    // 🌟 第一階段：單一精準打擊 + 強制台灣媒體
    // 捨棄併發以避開免費版「每秒 1 次」的限流地雷。
    // 加上 &country=tw 強制限定台灣媒體，確保繁體中文且聚焦國內視角。
    const query = encodeURIComponent('台海 OR 兩岸 OR 共軍 OR 國軍');
    const url = `https://gnews.io/api/v4/search?q=${query}&lang=zh&country=tw&max=10&apikey=${apiKey}`;
    
    const res = await fetch(url, { signal: controller.signal, next: { revalidate: 600 } });
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    
    const data = await res.json();
    clearTimeout(timeoutId);

    if (!data.articles || data.articles.length === 0) {
        return [{ id: 1, source: "系統回報", time: new Date().toLocaleTimeString("zh-TW", { timeZone: 'Asia/Taipei', hour: "2-digit", minute: "2-digit" }), title: "目前無台海相關新聞", snippet: "API 成功連線，但在指定條件下未回傳任何新聞。" }];
    }

    // 🌟 第二階段：程式碼嚴格審查 (Post-processing)
    const positiveRegex = /(台海|兩岸|國防|國軍|共軍|軍演|外交|地緣政治|解放軍|國安|軍事|戰機|艦艇|中共)/;
    const negativeRegex = /(遊戲|娛樂|動漫|電競|影劇|手遊|虛擬|真人版|航海王|抽卡|粉絲|明星|八卦|網紅|實況|長江存儲|消費級|體育|職棒|職籃|演唱會)/;

    const filteredArticles = data.articles.filter((article: any) => {
      const contentToSearch = (article.title + " " + (article.description || "")).toLowerCase();
      if (negativeRegex.test(contentToSearch)) return false; // 踩到地雷直接丟棄
      if (positiveRegex.test(contentToSearch)) return true;  // 符合條件保留
      return false;
    });

    if (filteredArticles.length === 0) {
        return [{ id: 1, source: "系統過濾", time: new Date().toLocaleTimeString("zh-TW", { timeZone: 'Asia/Taipei', hour: "2-digit", minute: "2-digit" }), title: "無重大政經軍事新聞", snippet: "已抓取基礎新聞，但經系統排除娛樂與無關訊息後，暫無值得警戒的局勢新聞。" }];
    }

    // 🌟 第三階段：送出前 3 筆最新新聞
    return filteredArticles.slice(0, 3).map((article: any, index: number) => ({
      id: index + 1,
      source: article.source.name || "國內新聞",
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
