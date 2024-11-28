"use client";
import React, { createContext, useState } from "react";

export const EditorData = createContext();

const EditorProvider = ({ children, ...props }) => {
  const [blocks, setBlocks] = useState([
    {
      type: "header",
      data: {
        text: "Inventory Management System Requirements",
        level: 1,
      },
    },
    {
      type: "paragraph",
      data: {
        text: "This document outlines the requirements for an Inventory Management System to efficiently manage inventory, products, suppliers, and warehouses.",
      },
    },
    {
      type: "header",
      data: {
        text: "Functional Requirements",
        level: 2,
      },
    },
    {
      type: "paragraph",
      data: {
        text: "1. **Inventory Management**: The system should allow users to manage inventory, including adding, updating, and removing products.",
      },
    },
    {
      type: "paragraph",
      data: {
        text: "2. **Product Management**: Users should be able to add, update, and remove products. Products should have attributes such as ID, name, description, price, and quantity available.",
      },
    },
    {
      type: "paragraph",
      data: {
        text: "3. **Supplier Management**: The system should enable users to manage suppliers, including adding and removing suppliers. Suppliers should have attributes such as ID, name, and contact information.",
      },
    },
    {
      type: "paragraph",
      data: {
        text: "4. **Warehouse Management**: Users should be able to manage warehouses, including adding and removing warehouses. Warehouses should have attributes such as ID and location.",
      },
    },
    {
      type: "paragraph",
      data: {
        text: "5. **Relationships**: The system should establish relationships between inventory, products, suppliers, and warehouses. For example, a product can be contained in the inventory, supplied by a supplier, and stored in a warehouse.",
      },
    },
    {
      type: "header",
      data: {
        text: "Non-Functional Requirements",
        level: 2,
      },
    },
    {
      type: "paragraph",
      data: {
        text: "1. **Performance**: The system should be responsive and capable of handling a large number of products, suppliers, and warehouses without significant performance degradation.",
      },
    },
    {
      type: "paragraph",
      data: {
        text: "2. **Security**: The system should implement proper authentication and authorization mechanisms to ensure that only authorized users can access and modify data.",
      },
    },
    {
      type: "paragraph",
      data: {
        text: "3. **Scalability**: The system should be designed to scale horizontally or vertically to accommodate increasing data volumes and user loads.",
      },
    },
    {
      type: "paragraph",
      data: {
        text: "4. **Reliability**: The system should be reliable, with minimal downtime and data integrity guarantees.",
      },
    },
    {
      type: "paragraph",
      data: {
        text: "5. **Usability**: The system should have a user-friendly interface with intuitive navigation and efficient workflows.",
      },
    },
  ]);

  return (
    <EditorData.Provider {...props} value={{ blocks, setBlocks }}>
      {children}
    </EditorData.Provider>
  );
};

export default EditorProvider;
