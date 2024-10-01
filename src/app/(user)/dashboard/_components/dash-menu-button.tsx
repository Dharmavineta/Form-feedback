"use client";

import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";

export const MenuButton = () => {
  const pathname = usePathname();
  const isDashboard = pathname.startsWith("/dashboard");

  if (!isDashboard) {
    return null;
  }

  return (
    <Button variant="ghost" className="mr-2 lg:hidden">
      <Menu className="h-6 w-6" />
    </Button>
  );
};
