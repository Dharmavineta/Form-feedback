import { PageHeader } from "@/components/page-header";
import React, { FC } from "react";
import Sidebar from "./dashboard/_components/sidebar";

type props = {
  children: React.ReactNode;
};

const layout: FC<props> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader />
      <div className="flex-1 w-full ">{children}</div>
    </div>
  );
};

export default layout;
