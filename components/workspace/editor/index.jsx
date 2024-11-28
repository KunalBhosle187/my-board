"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import EditorJS from "@editorjs/editorjs";
import { useParams } from "next/navigation";
import { useSocket } from "@/components/provider/socket-provider";
import { debounce } from "lodash";
import { useAuth } from "@clerk/nextjs";
import { updateWorkSpaceById } from "@/lib/queries";
import { toast } from "sonner";

const Editor = ({ value, workspaceId }) => {
  console.log({ value });
  const { userId } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  const ejInstance = useRef(null);
  const prevDataRef = useRef(null);

  const params = useParams();
  const { socket } = useSocket();

  const initEditor = async () => {
    try {
      const Header = (await import("@editorjs/header")).default;
      const List = (await import("@editorjs/list")).default;
      const Checklist = (await import("@editorjs/checklist")).default;
      const Raw = (await import("@editorjs/raw")).default;
      const Quote = (await import("@editorjs/quote")).default;
      const CodeTool = (await import("@editorjs/code")).default;

      if (!ejInstance.current) {
        ejInstance.current = new EditorJS({
          data: value,
          holder: "editorjs",
          autofocus: true,
          placeholder: "My awesome placeholder",
          tools: {
            header: { class: Header, inlineToolbar: ["link"] },
            list: { class: List, inlineToolbar: true },
            checklist: { class: Checklist, inlineToolbar: true },
            quote: { class: Quote, inlineToolbar: true },
            raw: { class: Raw, inlineToolbar: true },
            code: { class: CodeTool },
          },
          onChange: async (api, event) => {
            const data = await api.saver.save();
            saveToDatabase({ detail: JSON.stringify(data) });
            emitChanges(data);
          },
        });
      }
    } catch (error) {
      console.error("Failed to initialize Editor.js", error);
    }
  };

  // Save data to database
  const saveToDatabase = debounce(async (data) => {
    try {
      await updateWorkSpaceById(workspaceId, data);
      console.log("Data saved successfully");
      toast.success("Data saved successfully");
    } catch (error) {
      toast.error("Error saving data to database:", error);
      console.error("Error saving data to database:", error);
    }
  }, 1000);

  // Emit document changes to the server
  const emitChanges = async (payload) => {
    if (!prevDataRef.current && payload.blocks > 0) {
      prevDataRef.current == payload.blocks;
      socket.emit("send-editor-changes", JSON.stringify(payload));
    } else {
      const prevDataRefStr = JSON.stringify(prevDataRef);
      const currDataStr = JSON.stringify(payload.blocks);
      if (prevDataRefStr == currDataStr) return;
      socket.emit("send-editor-changes", JSON.stringify(payload));
    }
  };

  const calculateCaretPosition = () => {
    const selection = document.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0).cloneRange();
      const rect = range.getBoundingClientRect();
      const editorRect = document
        .getElementById("editorjs")
        .getBoundingClientRect();

      return {
        top: rect.top - editorRect.top,
        left: rect.left - editorRect.left,
        height: rect.height,
        width: rect.width,
      };
    }
    return { top: 0, left: 0, height: 0, width: 0 };
  };

  const emitCursorPosition = useCallback(
    debounce(() => {
      const position = calculateCaretPosition();
      socket.emit("send-cursor-move", position, userId, "editor");
    }, 100),
    [socket, params?.id]
  );

  const handleCursorUpdate = (userId, position, color, cursorType) => {
    if (cursorType == "editor") {
      let cursor = document.getElementById(`cursor-${userId}`);
      let cursorLabel = document.getElementById(`cursor-label-${userId}`);

      const hexToRgba = (hexColor, opacity) => {
        hexColor = hexColor.replace(/^#/, "");
        const r = parseInt(hexColor.substring(0, 2), 16);
        const g = parseInt(hexColor.substring(2, 4), 16);
        const b = parseInt(hexColor.substring(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
      };

      if (!cursor) {
        cursor = document.createElement("div");
        cursor.id = `cursor-${userId}`;
        cursor.className = "cursor";
        cursor.style.position = "absolute";
        cursor.style.width = "2px";
        document.getElementById("editorjs").appendChild(cursor);
      }

      if (!cursorLabel) {
        cursorLabel = document.createElement("div");
        cursorLabel.id = `cursor-label-${userId}`;
        cursorLabel.className = "cursor-label";
        cursorLabel.style.position = "absolute";
        cursorLabel.style.backgroundColor = color && hexToRgba(color, 0.2);
        cursorLabel.style.padding = "2px 5px";
        cursorLabel.style.borderRadius = "3px";
        cursorLabel.style.fontSize = "10px";
        cursorLabel.innerText = userId;
        document.getElementById("editorjs").appendChild(cursorLabel);
      }

      cursor.style.top = `${position.top}px`;
      cursor.style.left = `${position.left}px`;
      cursor.style.height = `${position.height}px`;
      cursor.style.width = position.width > 0 ? `${position.width}px` : `2px`;
      cursor.style.opacity = position.width > 0 ? 0.1 : 1;
      cursor.style.backgroundColor = color;

      cursorLabel.style.top = `${position.top - 20}px`;
      cursorLabel.style.left = `${position.left + 5}px`;
    }
  };

  useEffect(() => {
    if (socket) {
      socket.on("receive-cursor-move", handleCursorUpdate);
      return () => {
        socket.off("receive-cursor-move", handleCursorUpdate);
      };
    }
  }, [socket, handleCursorUpdate]);

  const handleDocumentUpdate = async (payload) => {
    if (!ejInstance.current) return;

    const updatedData = JSON.parse(payload);
    ejInstance.current.render(updatedData);
  };

  useEffect(() => {
    if (socket) {
      socket.on("receive-editor-changes", handleDocumentUpdate);
      return () => {
        socket.off("receive-editor-changes", handleDocumentUpdate);
      };
    }
  }, [socket, handleDocumentUpdate]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMounted(true);
    }
  }, []);

  useEffect(() => {
    const handleSelectionChange = () => {
      if (document.getSelection().rangeCount > 0) {
        emitCursorPosition();
      }
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [emitCursorPosition]);

  useEffect(() => {
    if (isMounted) {
      initEditor();

      return () => {
        if (ejInstance.current) {
          ejInstance.current.isReady
            .then(() => {
              ejInstance.current.destroy();
              ejInstance.current = null;
            })
            .catch((e) => console.error("ERROR editor cleanup", e));
        }
      };
    }
  }, [isMounted]);

  return (
    <div>
      <div className="prose max-w-full h-full" id="editorjs"></div>
    </div>
  );
};

export default Editor;
