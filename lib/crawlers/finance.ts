// 檔案：lib/crawlers/finance.ts

export async function fetchFinanceData() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); 

    // 1. 真實抓取：台灣證交所 (TWSE) 大盤 API
    let twseResult = { id: 1, name: "台股加權指數 (TWSE)", value: "暫無數據", change: "--", percent: "當日收盤", isDown: false };
    try {
      const twseRes = await fetch('https://openapi.twse.com.tw/v1/exchangeReport/FMTQIK', { signal: controller.signal, next: { revalidate: 3600 } });
      if (twseRes.ok) {
        const twseData = await twseRes.json();
        if (Array.isArray(twseData) && twseData.length > 0) {
          const latestTwse = twseData[twseData.length - 1];
          twseResult.value = latestTwse.TAIEX || "未公布";
          twseResult.change = latestTwse.Change || "0";
          twseResult.isDown = twseResult.change.includes("-");
        }
      }
    } catch (e) { console.error(e); twseResult.value = "連線異常"; }

    // 2. 🌟 終極修復：改用 RTER 全球即時匯率 API (精準到小數點後4位)
    let usdResult = { id: 2, name: "美元 / 台幣 (USD/TWD)", value: "暫無數據", change: "--", percent: "即時匯率", isDown: false };
    let cnyResult = { id: 3, name: "人民幣 / 台幣 (CNY/TWD)", value: "暫無數據", change: "--", percent: "即時匯率", isDown: false };
    
    try {
      const forexRes = await fetch('https://tw.rter.info/capi.php', { signal: controller.signal, next: { revalidate: 600 } });
      if (forexRes.ok) {
        const forexData = await forexRes.json();
        if (forexData.USDTWD && forexData.USDTWD.Exrate) {
          usdResult.value = forexData.USDTWD.Exrate.toFixed(4); // 顯示如 32.1456
          if (forexData.USDCNY && forexData.USDCNY.Exrate) {
            cnyResult.value = (forexData.USDTWD.Exrate / forexData.USDCNY.Exrate).toFixed(4);
          }
        }
      }
    } catch (e) { console.error(e); usdResult.value = "連線異常"; cnyResult.value = "連線異常"; }

    clearTimeout(timeoutId);
    return [twseResult, usdResult, cnyResult];

  } catch (error) {
    return [
      { id: 1, name: "台股加權指數", value: "系統逾時", change: "--", percent: "--", isDown: false },
      { id: 2, name: "匯率資訊", value: "系統逾時", change: "--", percent: "--", isDown: false },
    ];
  }
}
