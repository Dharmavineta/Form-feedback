import { PageHeader } from "@/components/page-header";
import React, { FC } from "react";

type props = {
  children: React.ReactNode;
};

const layout: FC<props> = ({ children }) => {
  return (
    <div>
      <PageHeader />
      <div className=" container px-5 2xl:px-0 mx-auto w-full max-w-screen-2xl py-5">
        {children}
      </div>
    </div>
  );
};

export default layout;
