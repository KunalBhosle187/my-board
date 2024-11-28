"use client";
import { useEffect, useState, useCallback } from "react";
import { useSocket } from "@/components/provider/socket-provider";
import { useUser } from "@clerk/nextjs";
import { useParams } from "next/navigation";
import Image from "next/image";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Users, MoreHorizontal } from "lucide-react";

export const ActiveUsers = () => {
  const { socket, isConnected } = useSocket();
  const { user } = useUser();
  const params = useParams();

  const [activeUsers, setActiveUsers] = useState([]);
  const [isSocketActive, setIsSocketActive] = useState(false);
  const [showAllUsers, setShowAllUsers] = useState(false);

  // Maximum number of users to show initially
  const MAX_VISIBLE_USERS = 5;

  useEffect(() => {
    if (!socket || !user || !isConnected || !params?.id) return;

    const setupRoom = () => {
      socket.emit("create-room", params.id, {
        id: user.id,
        name: user.fullName || user.username,
        img: user.imageUrl,
      });
      socket.emit("get-room-users", params.id);
    };

    // Initial setup
    setupRoom();

    // Handle room users
    const handleRoomUsers = (users) => {
      // Filter out current user and limit duplicates
      const uniqueUsers =
        users
          ?.filter((u) => u.id !== user.id)
          .filter(
            (user, index, self) =>
              index === self.findIndex((t) => t.id === user.id)
          ) || [];

      setActiveUsers(uniqueUsers);
    };

    // Handle socket status
    const handleSocketStatus = ({ connected }) => {
      setIsSocketActive(connected);
    };

    // Event listeners
    socket.on("room-users", handleRoomUsers);
    socket.on("socket-status", handleSocketStatus);

    // Set initial socket status
    setIsSocketActive(isConnected);

    // Periodic room refresh
    const refreshInterval = setInterval(() => {
      if (socket && isConnected) {
        socket.emit("get-room-users", params.id);
      }
    }, 30000); // Refresh every 30 seconds

    return () => {
      if (socket) {
        socket.off("room-users", handleRoomUsers);
        socket.off("socket-status", handleSocketStatus);
      }
      clearInterval(refreshInterval);
    };
  }, [socket, user, isConnected, params?.id]);

  // Render users with overflow handling
  const renderActiveUsers = () => {
    // Determine which users to show
    const usersToShow = showAllUsers
      ? activeUsers
      : activeUsers.slice(0, MAX_VISIBLE_USERS);

    return (
      <div className="flex items-center -space-x-2 relative">
        {usersToShow.map((activeUser) => (
          <TooltipProvider delayDuration={50} key={activeUser.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-8 h-8 rounded-full border-2 border-white overflow-hidden hover:z-10 transition-transform hover:scale-110">
                  <Image
                    src={activeUser.img}
                    alt={`${activeUser.name}'s avatar`}
                    width={32}
                    height={32}
                    className="rounded-full object-cover"
                    priority={false}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="center">
                <p className="font-normal text-xs">{activeUser.name}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}

        {/* Show overflow indicator */}
        {!showAllUsers && activeUsers.length > MAX_VISIBLE_USERS && (
          <div
            onClick={() => setShowAllUsers(true)}
            className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-300 transition-colors"
          >
            <MoreHorizontal className="w-4 h-4 text-gray-600" />
          </div>
        )}
      </div>
    );
  };

  // Render user count and status
  const renderUserCount = () => {
    if (!isSocketActive) {
      return (
        <Badge variant="warning" className="flex items-center gap-2">
          No Users
        </Badge>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <Users className="w-4 h-4 text-gray-500 " />
        <span className="text-sm text-gray-600">
          {activeUsers.length} Active
        </span>
      </div>
    );
  };

  return (
    <div className="flex items-center gap-4">
      {renderActiveUsers()}
      {renderUserCount()}

      {/* Modal for all users when overflow clicked */}
      {showAllUsers && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 " /> All Active Users
            </h2>
            <div className="grid grid-cols-3 gap-4">
              {activeUsers.map((user) => (
                <div key={user.id} className="flex flex-col items-center">
                  <Image
                    src={user.img}
                    alt={`${user.name}'s avatar`}
                    width={48}
                    height={48}
                    className="rounded-full object-cover mb-2"
                  />
                  <p className="text-sm text-center">{user.name}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowAllUsers(false)}
              className="mt-4 w-full bg-gray-100 hover:bg-gray-200 py-2 rounded-md"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveUsers;
