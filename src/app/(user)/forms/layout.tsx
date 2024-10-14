import React, { FC } from "react";
import FormSidebar from "./_components/form-sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";

type props = {
  children: React.ReactNode;
};

const layout: FC<props> = ({ children }) => {
  return (
    <div className="">
      <FormSidebar />
      <ScrollArea className="flex-1 lg:ml-[350px] h-[calc(100vh-3.6rem)]">
        <div className="h-full">{children}</div>
      </ScrollArea>
    </div>
  );
};

export default layout;
