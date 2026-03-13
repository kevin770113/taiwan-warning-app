export default function Home() {
  return (
    <div className="p-6 flex flex-col items-center justify-center min-h-[80vh]">
      <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg mb-6">
        <span className="text-2xl font-bold">警</span>
      </div>
      
      <h1 className="text-2xl font-extrabold text-slate-900 mb-2">台海戰爭預警系統</h1>
      <p className="text-sm text-slate-500 mb-8 text-center">
        即時情報 • 防災準備 • 避難所查詢
      </p>

      <div className="w-full bg-white rounded-xl p-6 text-center border border-slate-200 shadow-sm">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-3 w-24 bg-slate-300 rounded mb-4"></div>
          <div className="h-10 w-20 bg-slate-300 rounded mb-4"></div>
          <p className="text-slate-400 text-xs">系統連線中，準備載入預警儀表板...</p>
        </div>
      </div>
    </div>
  );
}
