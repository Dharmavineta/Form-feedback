"use client";
import React from "react";
import Link from "next/link";
import { BarChart, CreditCard, Home } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePathname } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const Sidebar = () => {
  const pathname = usePathname();
  const links = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Analytics", href: "/analytics", icon: BarChart },
    { name: "Subscription", href: "/subscription", icon: CreditCard },
  ];

  return (
    <div className="w-[250px] border-r bg-background hidden md:block md:fixed h-screen">
      <ScrollArea className="h-full py-6">
        <div className="space-y-1 pl-5">
          {links.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center gap-3 rounded-lg pl-3 py-3 text-sm font-medium transition-all hover:bg-sky-100/50 hover:text-accent-foreground rounded-tr-none rounded-br-none 
                ${
                  pathname === link.href
                    ? "bg-sky-100/50 text-accent-foreground border-r-2 border-sky-500 "
                    : "text-muted-foreground"
                }
                active:bg-accent/80 focus:bg-accent focus:text-accent-foreground
              `}
            >
              <link.icon className="h-4 w-4 text-sky-700" />
              <span>{link.name}</span>
            </Link>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default Sidebar;
