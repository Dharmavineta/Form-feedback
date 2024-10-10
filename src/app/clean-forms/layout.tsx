import React from "react";

type props = {
  children: React.ReactNode;
};

const layout = ({ children }: props) => {
  return <div>{children}</div>;
};

export default layout;
