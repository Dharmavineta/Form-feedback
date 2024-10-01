import { PageHeader } from "@/components/page-header";
import React, { FC } from "react";
import FormSidebar from "./_components/form-sidebar";

type props = {
  children: React.ReactNode;
};

const layout: FC<props> = ({ children }) => {
  return (
    <div>
      <div className="flex">
        <FormSidebar />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
};

export default layout;
