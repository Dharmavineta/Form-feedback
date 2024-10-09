import React from "react";
import { AI } from "../lib/ai";

type props = {
  children: React.ReactNode;
};

const layout = ({ children }: props) => {
  return <div>{children}</div>;
};

export default layout;
