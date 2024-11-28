"use client";
import React, { createContext, useState } from "react";

export const DynamicWidth = createContext();

const ResizeWidthProvider = ({ children, ...props }) => {
  const [resizableWidth, setResizableWidth] = useState(50);

  return (
    <DynamicWidth.Provider
      {...props}
      value={{ resizableWidth, setResizableWidth }}
    >
      {children}
    </DynamicWidth.Provider>
  );
};

export default ResizeWidthProvider;
