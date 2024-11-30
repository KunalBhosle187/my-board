"use client";

import React, { useCallback, useEffect, useRef, useState, useContext } from "react";
import EditorJS from "@editorjs/editorjs";
import { useParams } from "next/navigation";
import { useSocket } from "@/components/provider/socket-provider";
import { debounce } from "lodash";
import { useAuth, useUser } from "@clerk/nextjs";
import { updateWorkSpaceById } from "@/lib/queries";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { EditorData } from "@/components/provider/editor-provider";

function Editor({ value, workspaceId }) {
  console.log("Editor rendering with value:", value);
  const { userId } = useAuth();
  const { user } = useUser();
  const [isMounted, setIsMounted] = useState(false);
  const ejInstance = useRef(null);
  const prevDataRef = useRef(null);
  const isInitializedRef = useRef(false);
  const { theme } = useTheme();
  const { blocks, setBlocks } = useContext(EditorData);
  const params = useParams();
  const { socket } = useSocket();

  // Sync initial value with context if available
  useEffect(() => {
    if (value && value.blocks && value.blocks.length > 0) {
      setBlocks(value.blocks);
    }
  }, [value, setBlocks]);

  // Emit document changes to the server
  const emitChanges = useCallback(
    (payload) => {
      if (!socket || !payload || !payload.blocks) return;

      if (!prevDataRef.current && payload.blocks.length > 0) {
        prevDataRef.current = payload.blocks;
        socket.emit("send-editor-changes", JSON.stringify(payload));
      } else {
        const prevDataRefStr = JSON.stringify(prevDataRef.current);
        const currDataStr = JSON.stringify(payload.blocks);
        if (prevDataRefStr === currDataStr) return;
        prevDataRef.current = payload.blocks;
        socket.emit("send-editor-changes", JSON.stringify(payload));
      }
    },
    [socket]
  );

  // Save data to database
  const saveToDatabase = useCallback(
    debounce(async (data) => {
      if (!workspaceId) return;

      try {
        // Validate data before saving
        const editorData = JSON.parse(data.detail);
        if (
          !editorData ||
          !editorData.blocks ||
          editorData.blocks.length === 0
        ) {
          console.log("No content to save");
          return;
        }

        // Check if any block has actual content
        const hasContent = editorData.blocks.some(
          (block) =>
            block.data && block.data.text && block.data.text.trim() !== ""
        );

        if (!hasContent) {
          console.log("No meaningful content to save");
          return;
        }

        await updateWorkSpaceById(workspaceId, data);
        console.log("Data saved successfully");
        toast.success("Data saved successfully");
      } catch (error) {
        toast.error("Error saving data");
        console.error("Error saving data to database:", error);
      }
    }, 1000),
    [workspaceId]
  );

  const initEditor = useCallback(async () => {
    try {
      const Header = (await import("@editorjs/header")).default;
      const List = (await import("@editorjs/list")).default;
      const Checklist = (await import("@editorjs/checklist")).default;
      const Raw = (await import("@editorjs/raw")).default;
      const CodeTool = (await import("@editorjs/code")).default;

      const editorElement = document.getElementById("editorjs");
      if (!editorElement) {
        console.error("Editor element not found");
        return;
      }

      console.log("Initializing editor...");

      if (ejInstance.current) {
        console.log("Destroying existing instance");
        await ejInstance.current.destroy();
        ejInstance.current = null;
      }

      const editor = new EditorJS({
        holder: "editorjs",
        theme: theme === "dark" ? "dark" : "light",
        data: value || { blocks: [] },
        tools: {
          header: { class: Header, inlineToolbar: true },
          list: { class: List, inlineToolbar: true },
          checklist: { class: Checklist, inlineToolbar: true },
          raw: { class: Raw, inlineToolbar: true },
          code: { class: CodeTool },
        },
        placeholder: "Press Tab to open block tools",
        autofocus: true,
        onReady: () => {
          console.log("Editor.js is ready to work!");
          isInitializedRef.current = true;
        },
        onChange: async (api, event) => {
          try {
            const data = await api.saver.save();
            if (
              data &&
              data.blocks &&
              data.blocks.length > 0 &&
              isInitializedRef.current
            ) {
              // Update context first
              setBlocks(data.blocks);
              
              // Then handle other updates
              saveToDatabase({ detail: JSON.stringify(data) });
              emitChanges(data);
              
              console.log("Updated editor blocks:", data.blocks);
            }
          } catch (error) {
            console.error("Error in editor onChange:", error);
          }
        },
      });

      await editor.isReady;
      console.log("Editor initialized successfully");
      ejInstance.current = editor;
    } catch (error) {
      console.error("Failed to initialize Editor.js:", error);
      console.error("Initial value:", value);
    }
  }, [value, saveToDatabase, emitChanges, setBlocks]);

  const calculateCaretPosition = useCallback(() => {
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
  }, []); // Empty dependency array since it doesn't depend on any changing values

  const emitCursorPosition = useCallback(() => {
    if (!socket || !userId || !user) return;

    const debouncedEmit = debounce(() => {
      if (socket && socket.connected) {
        const position = calculateCaretPosition();
        socket.emit(
          "send-cursor-move",
          position,
          {
            id: userId,
            name:
              user.username ||
              user.fullName ||
              user.emailAddresses[0].emailAddress,
          },
          "editor"
        );
      }
    }, 100);

    debouncedEmit();
  }, [socket, userId, user, calculateCaretPosition]);

  const handleCursorUpdate = useCallback(
    (user, position, color, cursorType) => {
      if (cursorType == "editor") {
        let cursor = document.getElementById(`cursor-${user.id}`);
        let cursorLabel = document.getElementById(`cursor-label-${user.id}`);

        const hexToRgba = (hexColor, opacity) => {
          hexColor = hexColor.replace(/^#/, "");
          const r = parseInt(hexColor.substring(0, 2), 16);
          const g = parseInt(hexColor.substring(2, 4), 16);
          const b = parseInt(hexColor.substring(4, 6), 16);
          return `rgba(${r}, ${g}, ${b}, ${opacity})`;
        };

        if (!cursor) {
          cursor = document.createElement("div");
          cursor.id = `cursor-${user.id}`;
          cursor.className = "cursor";
          cursor.style.position = "absolute";
          cursor.style.width = "2px";
          document.getElementById("editorjs").appendChild(cursor);
        }

        if (!cursorLabel) {
          cursorLabel = document.createElement("div");
          cursorLabel.id = `cursor-label-${user.id}`;
          cursorLabel.className = "cursor-label";
          cursorLabel.style.position = "absolute";
          cursorLabel.style.backgroundColor = color && hexToRgba(color, 0.2);
          cursorLabel.style.padding = "2px 5px";
          cursorLabel.style.borderRadius = "3px";
          cursorLabel.style.fontSize = "10px";
          cursorLabel.innerText = user.name;
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
    },
    []
  );

  useEffect(() => {
    if (!isMounted) {
      setIsMounted(true);
      return;
    }

    const init = async () => {
      await initEditor();
    };

    if (!ejInstance.current) {
      init();
    }

    return () => {
      if (ejInstance.current) {
        console.log("Cleaning up editor instance");
        ejInstance.current.destroy();
        ejInstance.current = null;
        isInitializedRef.current = false;
      }
    };
  }, [isMounted, initEditor]);

  useEffect(() => {
    if (socket) {
      socket.on("receive-cursor-move", handleCursorUpdate);
      return () => {
        socket.off("receive-cursor-move", handleCursorUpdate);
      };
    }
  }, [socket, handleCursorUpdate]);

  useEffect(() => {
    if (!socket) return;

    const handleEditorChanges = (data) => {
      if (!ejInstance.current || !isInitializedRef.current) return;

      const parsedData = JSON.parse(data);
      if (parsedData?.blocks) {
        prevDataRef.current = parsedData.blocks;
        ejInstance.current.render(parsedData);
      }
    };

    socket.on("receive-editor-changes", handleEditorChanges);
    return () => {
      socket.off("receive-editor-changes", handleEditorChanges);
    };
  }, [socket]);

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

  return (
    <div className={`w-full `}>
      <div
        id="editorjs"
        className="prose prose-sm max-w-full p-4 focus:outline-none"
      ></div>
    </div>
  );
}

export default Editor;
