"use client";

import { useMyPresence, useOthers } from "@liveblocks/react/suspense";
import Cursor from "../workspace/editor/tools/cursor";

const LiveCursorProvider = () => {
  const others = useOthers();
  const [myPresence, updateMyPresence] = useMyPresence();

  // Get list of other users

  function handlePointerMove(e) {
    const cursor = { x: Math.floor(e.clientX), y: Math.floor(e.clientY) };
    updateMyPresence({ cursor });
  }

  function handlePointerLeave(e) {
    updateMyPresence({ cursor: null });
  }

  return (
    <div
      style={{ width: "100vw", height: "100vh" }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      {others
        .filter((other) => other.presence.cursor !== null)
        .map(({ connectionId, presence, info }) => (
          <Cursor
            info={info}
            key={connectionId}
            x={presence.cursor.x}
            y={presence.cursor.y}
          />
        ))}
    </div>
  );
};

export default LiveCursorProvider;
