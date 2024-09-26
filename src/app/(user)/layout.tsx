import { PageHeader } from "@/components/page-header";
import React, { FC } from "react";

type props = {
  children: React.ReactNode;
};

const layout: FC<props> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader />
      <div className="flex-1 w-full py-5">{children}</div>
    </div>
  );
};

export default layout;
