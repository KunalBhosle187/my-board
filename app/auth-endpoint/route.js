import { auth } from "@clerk/nextjs";
import liveblocks from "@/lib/liveblocks";
import { getWorkSpaceByUserId } from "@/lib/queries";
import { NextResponse } from "next/server";

export const POST = async (req) => {
  auth().protect();
  const { sessionClaims, userId } = await auth();
  const { room } = await req.json();

  const session = liveblocks.prepareSession(sessionClaims?.email, {
    userInfo: {
      name: sessionClaims?.fullName,
      email: sessionClaims?.email,
      avatar: sessionClaims?.image,
    },
  });
  console.log({ userId });

  const workspace = await getWorkSpaceByUserId();
  const workspacePresent = workspace.data.map((item) => item.id == room);

  if (workspacePresent) {
    session.allow(room, session.FULL_ACCESS);
    const { status, body } = await session.authorize();
    console.log("You are authorise");
    return new Response(body, { status });
  } else {
    return NextResponse.json({
      message: "You are not in same room",
      status: 403,
    });
  }
};
