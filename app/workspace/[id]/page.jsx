"use client";
import React, {
  useRef,
  useState,
  useCallback,
  useMemo,
  useEffect,
  useContext,
} from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ArrowBigLeftDashIcon } from "lucide-react";
import clsx from "clsx";
import { DynamicWidth } from "@/components/provider/resize-width-provider";
import { getWorkSpaceById } from "@/lib/queries";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { useSocket } from "@/components/provider/socket-provider";
import { useAuth, useUser } from "@clerk/nextjs";

const Whiteboard = dynamic(
  async () => (await import("@/components/workspace/whiteboard")).default,
  {
    ssr: false,
  }
);

const Editor = dynamic(
  async () => await import("@/components/workspace/editor/index"),
  {
    ssr: false,
  }
);

const Workspace = ({ params }) => {
  const { resizableWidth, setResizableWidth } = useContext(DynamicWidth);
  const [editorData, setEditorData] = useState([]);
  const [whiteboardData, setWhiteboardData] = useState([]);
  const { socket, isConnected } = useSocket();
  const { isSignedIn, user, isLoaded } = useUser();

  const [loading, setLoading] = useState(true);
  const [draggable, setDraggable] = useState(false);
  const [showDraggableIcon, setShowDraggableIcon] = useState(false);

  const blockRef = useRef(null);

  const handleEditorChange = useCallback((data) => {
    setEditorData(data);
  }, []);

  const startDrag = useCallback(() => {
    setDraggable(true);
  }, []);

  const handleDrag = useCallback(
    (event) => {
      if (draggable && blockRef.current) {
        const draggableWidth =
          event.clientX - blockRef.current.getBoundingClientRect().left;
        const blockWidth = blockRef.current.offsetWidth;
        const newResizableWidth = (draggableWidth / blockWidth) * 100;
        setResizableWidth(newResizableWidth.toFixed(2));
      }
    },
    [draggable]
  );

  const stopDrag = useCallback(() => {
    setDraggable(false);
  }, []);

  const initialEditorWidth = () => {
    setResizableWidth(40);
  };

  useEffect(() => {
    const getBlocks = async () => {
      setLoading(true);
      const data = await getWorkSpaceById(params.id);
      if (data?.error) {
        toast.error(data?.error);
      } else {
        setEditorData(JSON.parse(data?.data?.detail));
        setWhiteboardData(JSON.parse(data?.data?.whiteboard));
      }
      setLoading(false);
    };
    getBlocks();
  }, []);

  useEffect(() => {
    if (isSignedIn && isLoaded && socket && isConnected) {
      const userObj = { 
        id: user.id, 
        name: user.fullName, 
        img: user.imageUrl 
      };
      
      // Join the room when socket is connected and user is authenticated
      socket.emit("create-room", params.id, userObj);

      // Listen for other users joining
      socket.on("user-joined", (userId, userData) => {
        console.log("User joined:", userData);
        // Handle new user joined event here
      });

      // Cleanup listeners when component unmounts
      return () => {
        socket.off("user-joined");
      };
    }
  }, [socket, isConnected, params.id, user?.id, isSignedIn, isLoaded]);

  useEffect(() => {
    if (draggable) {
      document.addEventListener("mousemove", handleDrag);
      document.addEventListener("mouseup", stopDrag);
      return () => {
        document.removeEventListener("mousemove", handleDrag);
        document.removeEventListener("mouseup", stopDrag);
      };
    }
  }, [draggable, handleDrag, stopDrag]);

  useEffect(() => {
    if (resizableWidth == 100) {
      setShowDraggableIcon(true);
    } else {
      setShowDraggableIcon(false);
    }
  }, [resizableWidth]);

  return (
    <>
      <Button onClick={() => socket.disconnect()}>Disconnect Socket</Button>
      <main className="h-screen flex" ref={blockRef}>
        <div
          className={clsx(`container max-w-full m-5 `, {
            hidden: resizableWidth <= 3,
          })}
          style={{ width: `${resizableWidth}%` }}
        >
          {showDraggableIcon && (
            <Button variant="outline" onClick={initialEditorWidth}>
              <ArrowBigLeftDashIcon />
            </Button>
          )}
          <ScrollArea className="h-screen  max-w-full">
            <Editor value={editorData} workspaceId={params.id} />
            <ScrollBar orientation="vertical" />
          </ScrollArea>
        </div>

        <Separator
          id="Draggable"
          draggable="true"
          onMouseDown={startDrag}
          orientation="vertical"
          className="h-screen hover:cursor-grab active:cursor-grabbing"
        />

        <div style={{ width: `${100 - resizableWidth}%` }}>
          <Whiteboard reqId={params.id} initialData={whiteboardData} />
        </div>
      </main>
    </>
  );
};

export default Workspace;
