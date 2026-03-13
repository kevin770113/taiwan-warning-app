"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Activity, ShieldAlert, Map } from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "總覽", href: "/", icon: Home },
    { name: "情報", href: "/intelligence", icon: Activity },
    { name: "準備", href: "/preparedness", icon: ShieldAlert },
    { name: "避難", href: "/shelters", icon: Map },
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
