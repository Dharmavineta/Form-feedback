import React, { FC } from "react";
import Sidebar from "./_components/sidebar";

type props = {
  children: React.ReactNode;
};

const layout: FC<props> = ({ children }) => {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 md:ml-[250px]">{children}</div>
    </div>
  );
};

export default layout;
