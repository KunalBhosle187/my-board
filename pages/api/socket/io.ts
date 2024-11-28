import { Server as NetServer } from "http";
import { Server as ServerIO, Socket } from "socket.io";
import { NextApiRequest, NextApiResponse } from "next";
import { NextApiResponseServerIo } from "@/lib/types";
import { LRUCache } from "lru-cache";

const WS_SUBTYPES = {
  INIT: "INIT",
  UPDATE: "UPDATE",
} as const;

const WS_EVENTS = {
  SCENE_UPDATE: "scene-update",
  USER_JOIN: "user-join",
  RECEIVE_EDITOR_CHANGES: "receive-editor-changes",
  RECEIVE_CURSOR_MOVE: "receive-cursor-move",
} as const;

interface RoomData {
  elementVersions: Map<string, number>;
  userColors: Map<string, string>;
  userSockets: Map<string, string>;
  lastActivity: number;
}

interface UserObject {
  id: string;
  name: string;
  img: string;
}

const COLOR_PALETTE = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#FFA07A",
  "#98D8C8",
  "#F06292",
  "#AED581",
  "#FFD54F",
  "#4DB6AC",
  "#7986CB",
  "#9575CD",
  "#4DD0E1",
  "#81C784",
  "#DCE775",
  "#FFB74D",
  "#A1887F",
  "#90A4AE",
  "#B39DDB",
  "#E57373",
  "#F06292",
];

const roomsData = new LRUCache<string, RoomData>({
  max: 1000, // Maximum number of rooms to cache
  ttl: 1000 * 60 * 60 * 24, // Cache for 24 hours
  updateAgeOnGet: true,
});

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};

const getUniqueColor = (roomId: string): string => {
  const room = roomsData.get(roomId);
  if (!room) return COLOR_PALETTE[0];
  const usedColors = new Set(room.userColors.values());
  return (
    COLOR_PALETTE.find((color) => !usedColors.has(color)) || COLOR_PALETTE[0]
  );
};

const ioHandler = (req: NextApiRequest, res: NextApiResponseServerIo) => {
  if (!res.socket.server.io) {
    const path = "/api/socket/io";
    const httpServer: NetServer = res.socket.server as any;
    const io = new ServerIO(httpServer, {
      path,
      addTrailingSlash: false,
      cors: {
        origin: [
          process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
          "https://project-req.vercel.app",
          "http://localhost:3000",
        ],
        methods: ["GET", "POST"],
        allowedHeaders: ["content-type"],
        credentials: true,
      },
      transports: ["polling"],
    });

    io.on("connection", (socket: Socket) => {
      let currentRoom: string | null = null;

      socket.on("create-room", (roomId: string, userObj: UserObject) => {
        socket.join(roomId);
        currentRoom = roomId;
        const userColor = getUniqueColor(roomId);
        let roomData = roomsData.get(roomId);
        if (!roomData) {
          roomData = {
            elementVersions: new Map(),
            userColors: new Map(),
            userSockets: new Map(),
            lastActivity: Date.now(),
          };
          roomsData.set(roomId, roomData);
        }
        roomData.userColors.set(userObj.id, userColor);
        roomData.userSockets.set(userObj.id, socket.id);
        roomData.lastActivity = Date.now();
        socket.to(roomId).emit(WS_EVENTS.USER_JOIN, userObj, roomId, userColor);
      });

      socket.on(
        "send-scene-update",
        (
          updateType: keyof typeof WS_SUBTYPES,
          elements: any[],
          appState: any
        ) => {
          if (!currentRoom) return;
          const roomData = roomsData.get(currentRoom);
          if (!roomData) return;

          const syncableElements = elements.filter((element) => {
            const lastVersion = roomData.elementVersions.get(element.id) || 0;
            return element.version > lastVersion;
          });

          syncableElements.forEach((element) => {
            roomData.elementVersions.set(element.id, element.version);
          });

          roomData.lastActivity = Date.now();
          socket.to(currentRoom).emit(WS_EVENTS.SCENE_UPDATE, {
            type: updateType,
            payload: { elements: syncableElements, appState },
          });
        }
      );

      socket.on("send-editor-changes", (deltas: any) => {
        if (!currentRoom) return;
        const roomData = roomsData.get(currentRoom);
        if (!roomData) return;
        roomData.lastActivity = Date.now();
        socket.to(currentRoom).emit(WS_EVENTS.RECEIVE_EDITOR_CHANGES, deltas);
      });

      socket.on(
        "send-cursor-move",
        (position: any, userId: string, cursorType: string) => {
          if (!currentRoom) return;
          const roomData = roomsData.get(currentRoom);
          if (!roomData) return;
          let userColor = roomData.userColors.get(userId);
          if (!userColor) {
            userColor = getUniqueColor(currentRoom);
            roomData.userColors.set(userId, userColor);
          }
          roomData.lastActivity = Date.now();
          socket
            .to(currentRoom)
            .emit(
              WS_EVENTS.RECEIVE_CURSOR_MOVE,
              userId,
              position,
              userColor,
              cursorType
            );
        }
      );

      socket.on("disconnect", () => {
        if (currentRoom) {
          const roomData = roomsData.get(currentRoom);
          if (roomData) {
            const userIdToRemove = Array.from(
              roomData.userSockets.entries()
            ).find(([, socketId]) => socketId === socket.id)?.[0];
            if (userIdToRemove) {
              roomData.userColors.delete(userIdToRemove);
              roomData.userSockets.delete(userIdToRemove);
              socket
                .to(currentRoom)
                .emit(
                  WS_EVENTS.USER_JOIN,
                  { id: userIdToRemove, name: "", img: "" },
                  currentRoom,
                  null
                );
            }
            if (roomData.userSockets.size === 0) {
              roomsData.delete(currentRoom);
            }
          }
        }
      });
    });

    // Periodic cleanup of inactive rooms
    setInterval(() => {
      const now = Date.now();
      roomsData.forEach((roomData, roomId) => {
        if (now - roomData.lastActivity > 1000 * 60 * 60) {
          // 1 hour of inactivity
          roomsData.delete(roomId);
        }
      });
    }, 1000 * 60 * 15); // Run every 15 minutes

    res.socket.server.io = io;
  }
  res.end();
};

export default ioHandler;
