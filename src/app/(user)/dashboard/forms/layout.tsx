import React, { FC } from "react";

type props = {
  children: React.ReactNode;
};

const layout: FC<props> = ({ children }) => {
  return <div>{children}</div>;
};

export default layout;
