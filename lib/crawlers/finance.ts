// 檔案：lib/crawlers/finance.ts

export async function fetchFinanceData() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); 

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
          const changeStr = latestTwse.Change || "0";
          const isDown = changeStr.includes("-");
          
          twseResult = {
            id: 1,
            name: "台股加權指數 (TWSE)",
            // 🛠️ 修復點：證交所 API 欄位是全大寫 TAIEX
            value: latestTwse.TAIEX || latestTwse.Taiex || "未公布",
            change: changeStr,
            percent: "當日收盤", 
            isDown: isDown
          };
        }
      }
    } catch (twseErr) {
      console.error("台股 API 抓取失敗:", twseErr);
      twseResult.value = "連線異常";
    }

    // 2. 真實抓取：國際開源匯率 API
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
    return [twseResult, usdResult, cnyResult];

  } catch (error) {
    console.error("❌ 金融爬蟲發生重大錯誤:", error);
    return [
      { id: 1, name: "台股加權指數", value: "系統逾時", change: "--", percent: "--", isDown: false },
      { id: 2, name: "匯率資訊", value: "系統逾時", change: "--", percent: "--", isDown: false },
    ];
  }
}
