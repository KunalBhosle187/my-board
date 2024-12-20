"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { io as ClientIO } from "socket.io-client";
import { useUser } from "@clerk/nextjs";
import { useParams } from "next/navigation";

const SocketContext = createContext({
  socket: null,
  isConnected: false,
});

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const { user } = useUser();
  const params = useParams();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user || !params?.id) return;

    const socketInstance = new ClientIO(
      process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
      {
        path: "/api/socket/io",
        addTrailingSlash: false,
        transports: ["polling"],
      }
    );

    socketInstance.on("connect", () => {
      console.log("Socket connected:", socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on("disconnect", () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    });

    socketInstance.on("connect_error", (err) => {
      console.log("Socket connection error:", err.message);
      setIsConnected(false);
    });

    // Handle socket status
    socketInstance.on("socket-status", ({ connected }) => {
      if (!connected && socketInstance.connected) {
        // Only one user, disconnect socket
        socketInstance.disconnect();
      } else if (connected && !socketInstance.connected) {
        // Multiple users, reconnect socket
        socketInstance.connect();
      }
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [user, params?.id]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
