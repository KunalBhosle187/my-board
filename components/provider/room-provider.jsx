"use client";
import {
  ClientSideSuspense,
  RoomProvider as RoomProviderWrapper,
} from "@liveblocks/react/suspense";
import LiveCursorProvider from "./live-cursor-provider";
import Loader from "@/components/ui/loader";

const RoomProvider = ({ roomId, children }) => {
  return (
    <RoomProviderWrapper id={roomId} initialPresence={{ cursor: null }}>
      <ClientSideSuspense fallback={<Loader />}>
        {/* <LiveCursorProvider>{children}</LiveCursorProvider> */}
        {children}
      </ClientSideSuspense>
    </RoomProviderWrapper>
  );
};

export default RoomProvider;
