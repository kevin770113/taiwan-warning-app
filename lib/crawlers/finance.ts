// 檔案：lib/crawlers/finance.ts

export async function fetchFinanceData() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 秒防禦

    // 1. 真實抓取：台灣證交所 (TWSE) 大盤 API
    let twseResult = { 
      id: 1, 
      name: "台股加權指數 (TWSE)", 
      value: "暫無數據", 
      change: "--", 
      percent: "--", 
      isDown: false 
    };

    try {
      const twseRes = await fetch('https://openapi.twse.com.tw/v1/exchangeReport/FMTQIK', {
        signal: controller.signal,
        next: { revalidate: 3600 } 
      });
      if (twseRes.ok) {
        const twseData = await twseRes.json();
        if (Array.isArray(twseData) && twseData.length > 0) {
          const latestTwse = twseData[twseData.length - 1];
          // 證交所的 Change 欄位有時帶有正負號
          const changeStr = latestTwse.Change || "0";
          const isDown = changeStr.includes("-");
          
          twseResult = {
            id: 1,
            name: "台股加權指數 (TWSE)",
            value: latestTwse.Taiex || "未公布",
            change: changeStr,
            percent: "當日收盤", // Open API 預設未提供精準百分比，誠實標示狀態
            isDown: isDown
          };
        }
      }
    } catch (twseErr) {
      console.error("台股 API 抓取失敗:", twseErr);
      twseResult.value = "連線異常";
    }

    // 2. 真實抓取：國際開源匯率 API (免費且免金鑰，提供基準匯率)
    let usdResult = { id: 2, name: "美元 / 台幣 (USD/TWD)", value: "暫無數據", change: "--", percent: "基準匯率", isDown: false };
    let cnyResult = { id: 3, name: "人民幣 / 台幣 (CNY/TWD)", value: "暫無數據", change: "--", percent: "基準匯率", isDown: false };

    try {
      const forexRes = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
        signal: controller.signal,
        next: { revalidate: 3600 }
      });
      if (forexRes.ok) {
        const forexData = await forexRes.json();
        const rates = forexData.rates;
        if (rates && rates.TWD) {
          usdResult.value = rates.TWD.toFixed(3);
          // 人民幣兌台幣 = (USD/TWD) / (USD/CNY)
          if (rates.CNY) {
            const cnyToTwd = rates.TWD / rates.CNY;
            cnyResult.value = cnyToTwd.toFixed(3);
          }
        }
      }
    } catch (forexErr) {
      console.error("匯率 API 抓取失敗:", forexErr);
      usdResult.value = "連線異常";
      cnyResult.value = "連線異常";
    }

    clearTimeout(timeoutId);

    // 回傳真實組裝的數據
    return [twseResult, usdResult, cnyResult];

  } catch (error) {
    console.error("❌ 金融爬蟲發生重大錯誤:", error);
    // 🛡️ 誠實防護網：整體逾時或崩潰時的回報
    return [
      { id: 1, name: "台股加權指數", value: "系統逾時", change: "--", percent: "--", isDown: false },
      { id: 2, name: "匯率資訊", value: "系統逾時", change: "--", percent: "--", isDown: false },
    ];
  }
}
