"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";

interface SidebarItem {
  name: string;
  icon: any;
  link: string;
}

type SidebarProps = {
  items: SidebarItem[];
  widthCollapsed?: number;
  widthExpanded?: number;
  className?: string;
};

export default function Sidebar({
  items,
  widthCollapsed = 60,
  widthExpanded = 220,
  className,
}: SidebarProps) {
  const [expanded, setExpanded] = useState(false);
  const pathname = usePathname();

  return (
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className={cn(
        "fixed top-0 left-0 z-50 h-full bg-gradient-to-b from-white via-blue-50 to-blue-100 shadow-xl flex flex-col items-center py-4 border-r border-blue-100 transition-all duration-200 ease-in-out",
        className
      )}
      style={{
        width: expanded ? widthExpanded : widthCollapsed,
        minWidth: expanded ? widthExpanded : widthCollapsed,
        maxWidth: expanded ? widthExpanded : widthCollapsed,
        overflow: "hidden",
      }}
    >
      <div className="flex items-center justify-center w-full mb-6">
        <Logo />
        {expanded && (
          <span className="ml-2 text-lg font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent tracking-wide">
            SwasthaAI
          </span>
        )}
      </div>
      <div className="w-full border-b border-blue-200 mb-4" />
      <div className="flex flex-col gap-2 w-full mt-6 px-2">
        {items.map((item, idx) => {
          const isActive = pathname.startsWith(item.link);
          return (
            <Link
              key={item.name}
              href={item.link}
              className={cn(
                "group relative flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-100 ease-in-out",
                expanded ? "justify-start" : "justify-center",
                isActive
                  ? "bg-blue-100 text-blue-700 font-semibold shadow-inner"
                  : "hover:bg-blue-50 text-gray-700"
              )}
              style={{ minWidth: 0 }}
            >
              <span className={cn("text-xl", isActive && "text-blue-700")}>
                {item.icon}
              </span>
              {expanded && (
                <span className="whitespace-nowrap text-base font-medium">
                  {item.name}
                </span>
              )}
              {!expanded && (
                <span className="absolute left-full ml-2 px-2 py-1 rounded bg-blue-700 text-white text-xs opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50 shadow-lg">
                  {item.name}
                </span>
              )}
            </Link>
          );
        })}
      </div>
      <div className="flex-1" />
      <div className={cn("w-full px-2 pb-2", expanded ? "block" : "hidden")}>
        <div className="text-xs text-gray-400 text-center">
          &copy; 2025 SwasthaAI
        </div>
      </div>
    </aside>
  );
}