import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "台海預警 App",
  description: "即時兩岸政治緊張係數、避難所與急難準備資訊",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body className={`${inter.className} bg-slate-200 antialiased`}>
        <main className="max-w-md mx-auto min-h-screen bg-slate-50 shadow-2xl relative pb-20">
          {children}
          {/* 加入底部導覽列 */}
          <BottomNav />
        </main>
      </body>
    </html>
  );
}
