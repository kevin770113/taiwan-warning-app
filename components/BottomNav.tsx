"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
// 引入 Globe 給情報用，把 Activity 讓給地震用
import { Home, Globe, ShieldAlert, Map, Activity } from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();

  // 在這裡加入第五個分頁「地震」
  const navItems = [
    { name: "總覽", href: "/", icon: Home },
    { name: "情報", href: "/intelligence", icon: Globe },
    { name: "準備", href: "/preparedness", icon: ShieldAlert },
    { name: "避難", href: "/shelters", icon: Map },
    { name: "地震", href: "/earthquake", icon: Activity }, // 🌟 新增的地震分頁
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 pt-2 pb-6 flex justify-between items-center max-w-md mx-auto z-50">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`flex flex-col items-center justify-center w-full py-1 ${
              isActive ? "text-blue-600" : "text-slate-400 hover:text-slate-900"
            }`}
          >
            <Icon size={24} className={isActive ? "fill-blue-50" : ""} />
            <span className="text-[10px] mt-1 font-medium">{item.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
