import AiResponseProvider from "@/components/provider/ai-response-provider";
import Navbar from "@/components/workspace/navbar";
import { getWorkSpaceById } from "@/lib/queries";
import React from "react";
import RoomProvider from "@/components/provider/room-provider";
import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";

const WorkspaceLayout = async ({ children, params }) => {
  auth().protect();
  const data = await getWorkSpaceById(params.id);
  if (data.status === 404 || data.status === 500) {
    redirect("/workspace");
  }

  return (
    <div className="min-h-screen">
      <AiResponseProvider>
        {/* <RoomProvider roomId={params.id}> */}
        <Navbar title={data?.data?.title} id={params.id} />
        {children}
        {/* </RoomProvider> */}
      </AiResponseProvider>
    </div>
  );
};

export default WorkspaceLayout;
