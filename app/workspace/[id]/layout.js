import AiResponseProvider from "@/components/provider/ai-response-provider";
import Navbar from "@/components/workspace/navbar";
import { getWorkSpaceById } from "@/lib/queries";
import React from "react";
import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";

const WorkspaceLayout = async ({ children, params }) => {
  auth().protect();
  const data = await getWorkSpaceById(params.id);
  if (data.status === 404 || data.status === 500) {
    redirect("/workspace");
  }

  return (
    <div className="h-screen flex flex-col">
      <AiResponseProvider>
        <Navbar title={data?.data?.title} id={params.id} />
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </AiResponseProvider>
    </div>
  );
};

export default WorkspaceLayout;
