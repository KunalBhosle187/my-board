"use client";
import React, { createContext, useState } from "react";

export const AiResponse = createContext();

const AiResponseProvider = ({ children, ...props }) => {
  const [response, setResponse] = useState("");

  return (
    <AiResponse.Provider {...props} value={{ response, setResponse }}>
      {children}
    </AiResponse.Provider>
  );
};

export default AiResponseProvider;
