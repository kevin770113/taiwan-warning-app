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

    // 🌟 第一階段：API 寬鬆抓取
    // 只用最簡單的 OR 語法避免 API 當機，並將抓取量拉高到 10 筆，建立過濾樣本池
    const query = encodeURIComponent('台海 OR 兩岸');
    const url = `https://gnews.io/api/v4/search?q=${query}&lang=zh&max=10&sortby=publishedAt&apikey=${apiKey}`;
    
    const res = await fetch(url, { signal: controller.signal, next: { revalidate: 600 } });
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    
    const data = await res.json();
    clearTimeout(timeoutId);

    if (!data.articles || data.articles.length === 0) {
        return [{ id: 1, source: "系統回報", time: new Date().toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" }), title: "目前無台海相關新聞", snippet: "過去一段時間內，API 未回傳任何基礎資料。" }];
    }

    // 🌟 第二階段：程式碼嚴格審查 (Post-processing)
    // 擴充正向詞：放寬條件，只要沾上邊的地緣政治與軍事都能進來
    const positiveRegex = /(台海|兩岸|國防|國軍|共軍|軍演|外交|地緣政治|解放軍|國安|軍事)/;
    // 嚴厲負向詞：一票否決，徹底屏蔽娛樂廢文
    const negativeRegex = /(遊戲|娛樂|動漫|電競|影劇|手遊|虛擬|真人版|航海王|抽卡|粉絲|明星|八卦|網紅|實況|長江存儲|消費級)/;

    const filteredArticles = data.articles.filter((article: any) => {
      // 將標題和內文合併起來一起檢查
      const contentToSearch = (article.title + " " + (article.description || "")).toLowerCase();
      
      // 規則 1：踩到負面詞直接丟棄 (一票否決)
      if (negativeRegex.test(contentToSearch)) {
        return false;
      }
      
      // 規則 2：必須包含至少一個正向詞
      if (positiveRegex.test(contentToSearch)) {
        return true;
      }

      return false;
    });

    // 如果過濾後 10 篇新聞全軍覆沒（例如全是娛樂新聞）
    if (filteredArticles.length === 0) {
        return [{ id: 1, source: "系統過濾", time: new Date().toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" }), title: "無重大政經軍事新聞", snippet: "已排除娛樂與無關訊息，目前暫無值得警戒的台海局勢新聞。" }];
    }

    // 🌟 第三階段：只取過濾後存活的前 3 筆最新新聞，送給前端 UI
    return filteredArticles.slice(0, 3).map((article: any, index: number) => ({
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
