"use client";
import React, { createContext, useState } from "react";

export const ExcalidrawData = createContext();

const ExcalidrawProvider = ({ children, ...props }) => {
  const [excalidrawAPI, setExcalidrawAPI] = useState(null);

  return (
    <ExcalidrawData.Provider
      {...props}
      value={{ excalidrawAPI, setExcalidrawAPI }}
    >
      {children}
    </ExcalidrawData.Provider>
  );
};

export default ExcalidrawProvider;
