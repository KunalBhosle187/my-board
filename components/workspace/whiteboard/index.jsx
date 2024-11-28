import React, { useEffect, useState, useCallback, useRef } from "react";
import { Excalidraw, getSceneVersion } from "@excalidraw/excalidraw";
import { useSocket } from "@/components/provider/socket-provider";
import { useAuth } from "@clerk/clerk-react";
import { throttle } from "lodash";
import Cursor from "@/components/workspace/whiteboard/cursor/index";
import { debounce } from "lodash";
import { toast } from "sonner";
import { updateWorkSpaceById } from "@/lib/queries";

const Whiteboard = ({ reqId, initialData }) => {
  const { socket } = useSocket();
  const { userId } = useAuth();

  const [pointerData, setPointerData] = useState(new Map());
  const excalidrawAPIRef = useRef(null);
  const lastSceneVersionRef = useRef(null);
  const containerRef = useRef(null);

  // Function to emit cursor movement
  const handlePointerMoveUpdate = useCallback(
    (x, y) => {
      if (socket && excalidrawAPIRef.current) {
        socket.emit("send-cursor-move", { userId, x, y }, userId, "whiteboard");
      }
    },
    [socket, userId, reqId]
  );

  // Save data to database
  const saveToDatabase = debounce(async (data) => {
    try {
      await updateWorkSpaceById(reqId, data);
      console.log("Data saved successfully");
      toast.success("Data saved successfully");
    } catch (error) {
      toast.error("Error saving data to database:", error);
      console.error("Error saving data to database:", error);
    }
  }, 1000);

  // Throttled function to handle scene changes, including appState
  const throttledHandleSceneChange = useCallback(
    throttle((elements, appState) => {
      if (excalidrawAPIRef.current) {
        const sceneVersion = getSceneVersion(elements);
        if (lastSceneVersionRef.current !== sceneVersion) {
          lastSceneVersionRef.current = sceneVersion;
          saveToDatabase({ whiteboard: JSON.stringify({ elements }) });
          socket.emit("send-scene-update", "UPDATE", elements, appState, reqId);
        }
      }
    }, 100), // Adjust throttle delay (in milliseconds) as needed
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

  useEffect(() => {
    if (!socket) return;

    const handleUserJoin = (newUserId) => {
      console.log(`${newUserId} has joined`);
    };

    const handlePointerUpdate = (userId, position, color, cursorType) => {
      if (cursorType === "whiteboard") {
        setPointerData((prev) => ({
          ...prev,
          [userId]: { ...position, color },
        }));
      }
    };

    // Listen for remote scene updates
    socket.on("scene-update", handleRemoteSceneUpdate);
    socket.on("user-join", handleUserJoin);
    socket.on("receive-cursor-move", handlePointerUpdate);

    return () => {
      socket.off("scene-update", handleRemoteSceneUpdate);
      socket.off("user-join", handleUserJoin);
      socket.off("receive-cursor-move", handlePointerUpdate);
    };
  }, [socket, handleRemoteSceneUpdate]);

  // Throttle pointer move handling to avoid excessive socket emissions
  const handlePointerMove = useCallback(
    throttle((event) => {
      if (!containerRef.current || !socket || !userId) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      handlePointerMoveUpdate(x, y);
    }, 100), // Adjust throttle delay (in milliseconds) as needed
    [handlePointerMoveUpdate]
  );

  return (
    <div
      ref={containerRef}
      className="w-full h-[800px] relative flex-1 overflow-hidden"
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
      />
      {Object.entries(pointerData).map(([id, { x, y, color }]) => (
        <Cursor variant="name" name={id} key={id} color={color} x={x} y={y} />
      ))}
    </div>
  );
};

export default Whiteboard;
