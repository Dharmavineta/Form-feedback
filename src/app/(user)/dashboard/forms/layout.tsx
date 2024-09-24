import React, { FC } from "react";
import Sidebar from "./_components/sidebar";

type props = {
  children: React.ReactNode;
};

const layout: FC<props> = ({ children }) => {
  return (
    <div className="flex">
      <Sidebar />

      {children}
    </div>
  );
};

export default layout;
