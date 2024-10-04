"use client";
import React from "react";
import Link from "next/link";
import { BarChart, CreditCard, Home } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePathname } from "next/navigation";

const Sidebar = () => {
  const pathname = usePathname();
  const links = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Analytics", href: "/analytics", icon: BarChart },
    { name: "Subscription", href: "/subscription", icon: CreditCard },
  ];

  return (
    <div className="w-[250px] border-r bg-background h-[calc(100vh-56px)]">
      <ScrollArea className="h-full py-6">
        <div className="space-y-1 px-3">
          {links.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground
                ${
                  pathname === link.href
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground"
                }
                active:bg-accent/80 focus:bg-accent focus:text-accent-foreground
              `}
            >
              <link.icon className="h-4 w-4" />
              <span>{link.name}</span>
            </Link>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default Sidebar;
