import React, { useEffect, useState, useCallback, useRef, use } from "react";
import { Excalidraw, getSceneVersion } from "@excalidraw/excalidraw";
import { useSocket } from "@/components/provider/socket-provider";
import { useAuth, useUser } from "@clerk/clerk-react";
import { throttle } from "lodash";
import Cursor from "@/components/workspace/whiteboard/cursor/index";
import { debounce } from "lodash";
import { toast } from "sonner";
import { updateWorkSpaceById } from "@/lib/queries";
import { useTheme } from "next-themes";

const Whiteboard = ({ reqId, initialData }) => {
  const { theme } = useTheme();
  const { socket } = useSocket();
  const { userId } = useAuth();
  const { user } = useUser();

  const [pointerData, setPointerData] = useState(new Map());
  const excalidrawAPIRef = useRef(null);
  const lastSceneVersionRef = useRef(null);
  const containerRef = useRef(null);
  const isInitializedRef = useRef(false);

  // Function to emit cursor movement
  const handlePointerMoveUpdate = useCallback(
    (x, y) => {
      if (socket && excalidrawAPIRef.current) {
        socket.emit(
          "send-cursor-move",
          { userId, x, y },
          {
            id: userId,
            name:
              user.username ||
              user.fullName ||
              user.emailAddresses[0].emailAddress,
          },
          "whiteboard"
        );
      }
    },
    [socket, userId, user.username, user.fullName, user.emailAddresses]
  );

  // Save data to database
  const saveToDatabase = debounce(async (data) => {
    try {
      // Check if there are actual elements to save
      const elements = JSON.parse(data.whiteboard).elements;
      if (!elements || elements.length === 0) {
        console.log("No elements to save");
        return;
      }

      await updateWorkSpaceById(reqId, data);
      console.log("Data saved successfully");
      toast.success("Data saved successfully");
    } catch (error) {
      toast.error("Error saving data");
      console.error("Error saving data to database:", error);
    }
  }, 1000);

  // Throttled function to handle scene changes, including appState
  const throttledHandleSceneChange = useCallback(
    throttle((elements, appState) => {
      if (excalidrawAPIRef.current) {
        const sceneVersion = getSceneVersion(elements);

        // Only save and emit if there's a real change, elements exist, and not initializing
        if (
          lastSceneVersionRef.current !== sceneVersion &&
          elements &&
          elements.length > 0 &&
          isInitializedRef.current
        ) {
          lastSceneVersionRef.current = sceneVersion;
          saveToDatabase({ whiteboard: JSON.stringify({ elements }) });
          socket.emit("send-scene-update", "UPDATE", elements, appState, reqId);
        }
      }
    }, 100),
    [socket, reqId]
  );

  // Handle scene changes
  const handleSceneChange = useCallback(
    (elements, appState) => {
      if (excalidrawAPIRef.current) {
        throttledHandleSceneChange(elements, appState);
      }
    },
    [throttledHandleSceneChange]
  );

  // Handle remote scene update, including appState
  const handleRemoteSceneUpdate = useCallback(
    (update) => {
      if (!update || !update.payload) {
        return; // Ignore if invalid or no payload
      }

      const { elements, appState } = update.payload;

      try {
        // Cache remote elements
        const updatedElements = elements.reduce((acc, element) => {
          acc[element.id] = element;
          return acc;
        }, {});

        // Merge local and remote elements
        if (excalidrawAPIRef.current) {
          const localElements = excalidrawAPIRef.current.getSceneElements();
          if (!localElements) {
            console.error("Scene elements not available");
            return; // Exit early if no elements are available
          }
          const mergedElements = [
            ...localElements.filter((elem) => !updatedElements[elem.id]),
            ...elements,
          ];
          if (appState.collaborators) {
            delete appState.collaborators;
          }

          // Update the scene with both elements and appState
          excalidrawAPIRef.current.updateScene({
            elements: mergedElements,
            appState: {
              zoom: appState.zoom,
              scrollX: appState.scrollX,
              scrollY: appState.scrollY,
              offsetLeft: appState.offsetLeft,
              offsetTop: appState.offsetTop,
              width: appState.width,
              height: appState.height,
            }, // Include appState in the update
          });
        }

        console.log("Processed remote scene update:", elements.length);
      } catch (error) {
        console.error("Error handling remote scene update:", error);
      }
    },
    [excalidrawAPIRef]
  );

  const handlePointerUpdate = useCallback(
    (user, position, color, cursorType) => {
      if (cursorType === "whiteboard") {
        setPointerData((prev) => ({
          ...prev,
          [user.id]: { ...position, color, name: user.name },
        }));
      }
    },
    []
  );

  useEffect(() => {
    if (!socket) return;

    // Listen for remote scene updates
    socket.on("scene-update", handleRemoteSceneUpdate);
    socket.on("receive-cursor-move", handlePointerUpdate);

    return () => {
      socket.off("scene-update", handleRemoteSceneUpdate);
      socket.off("receive-cursor-move", handlePointerUpdate);
    };
  }, [socket, handleRemoteSceneUpdate, handlePointerUpdate, pointerData]);

  useEffect(() => {
    if (initialData) {
      try {
        const parsedData = JSON.parse(initialData);
        if (excalidrawAPIRef.current) {
          excalidrawAPIRef.current.updateScene(parsedData);
        }
      } catch (error) {
        console.error("Error parsing initial data:", error);
      }
    }
    // Set initialization flag after initial data is loaded
    isInitializedRef.current = true;
  }, [initialData]);

  // Throttle pointer move handling to avoid excessive socket emissions
  const handlePointerMove = useCallback(
    throttle((event) => {
      if (!containerRef.current || !socket || !userId) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      handlePointerMoveUpdate(x, y);
    }, 100), // Adjust throttle delay (in milliseconds) as needed
    [containerRef, socket, userId, handlePointerMoveUpdate]
  );

  return (
    <div
      ref={containerRef}
      className="w-full h-[calc(100vh-4rem)] relative flex-1 overflow-hidden shadow-sm"
      onPointerMove={handlePointerMove}
    >
      <Excalidraw
        excalidrawAPI={(api) => {
          if (api) {
            excalidrawAPIRef.current = api;
          }
        }}
        initialData={initialData}
        onChange={handleSceneChange}
        viewModeEnabled={false}
        zenModeEnabled={false}
        gridModeEnabled={false}
        theme={theme === "dark" ? "dark" : "light"}
      />
      {Object.entries(pointerData).map(([id, { x, y, color, name }]) => (
        <Cursor
          variant="name"
          name={name}
          key={id}
          color={color}
          x={x}
          y={y}
          className="animate-fade-in"
        />
      ))}
    </div>
  );
};

export default Whiteboard;
