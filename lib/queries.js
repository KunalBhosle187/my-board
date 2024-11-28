"use server";

import { auth, Clerk } from "@clerk/nextjs/server";
import prisma from "./prisma";
import { toast } from "sonner";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

const clerk = new Clerk({ secretKey: process.env.CLERK_SECRET_KEY });

// Constants for error messages and status codes
const ERRORS = {
  AUTH_ERROR: "You must be signed in to perform this action.",
  TITLE_UNIQUE_ERROR: "Title should be unique.",
};

const STATUS_CODES = {
  SUCCESS: 200,
  SERVER_ERROR: 500,
  NOT_FOUND: 404,
};

export const createWorkSpace = async (data) => {
  const { userId } = auth();

  // Check if userId is available
  if (!userId) {
    throw new Error(ERRORS.AUTH_ERROR);
  }

  try {
    const workspace = await prisma.requirement.create({
      data: { user_id: userId, ...data },
    });
    revalidatePath("/workspace");
    return {
      message: "Workspace created successfully",
      status: STATUS_CODES.SUCCESS,
    };
  } catch (e) {
    console.error("Error creating workspace:", e);

    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return {
        message: ERRORS.TITLE_UNIQUE_ERROR,
        status: STATUS_CODES.SERVER_ERROR,
      };
    }

    // Handle other errors here if needed
    return {
      message: "Failed to create workspace",
      status: STATUS_CODES.SERVER_ERROR,
    };
  }
};

export const getWorkSpaceByUserId = async () => {
  const { userId } = auth();

  // Check if userId is available
  if (!userId) {
    throw new Error(ERRORS.AUTH_ERROR);
  }

  try {
    const data = await prisma.requirement.findMany({
      where: {
        user_id: userId,
      },
    });
    return {
      data: data,
      message: "Workspace created successfully",
      status: STATUS_CODES.SUCCESS,
    };
  } catch (e) {
    console.log("___ERROR___", { e });
    // Handle other errors here if needed
    return {
      error: "Failed to get user workspace",
      status: STATUS_CODES.SERVER_ERROR,
    };
  }
};

export const getWorkSpaceById = async (id) => {
  const { userId } = auth();

  // Check if userId is available
  if (!userId) {
    throw new Error(ERRORS.AUTH_ERROR);
  }

  try {
    const data = await prisma.requirement.findUnique({
      where: {
        id: parseInt(id),
        OR: [{ user_id: userId }, { invite: { has: userId } }],
      },
    });
    console.log({ data });
    if (data == null) {
      return {
        error: "Workspace not found",
        status: STATUS_CODES.NOT_FOUND,
      };
    }
    return {
      data: data,
      message: "Workspace found",
      status: STATUS_CODES.SUCCESS,
    };
  } catch (e) {
    console.log(e);
    // Handle other errors here if needed
    return {
      error: "Failed to get user workspace",
      status: STATUS_CODES.SERVER_ERROR,
    };
  }
};

export const updateWorkSpaceById = async (id, updatedData) => {
  const { userId } = auth();

  // Check if userId is available
  if (!userId) {
    throw new Error(ERRORS.AUTH_ERROR);
  }

  try {
    const data = await prisma.requirement.update({
      where: {
        id: parseInt(id),
      },
      data: updatedData,
    });
    return {
      data: data,
      message: "Workspace updated",
      status: STATUS_CODES.SUCCESS,
    };
  } catch (e) {
    console.log(e);
    // Handle other errors here if needed
    return {
      error: "Something went wrong",
      status: STATUS_CODES.SERVER_ERROR,
    };
  }
};

export const inviteUser = async (id, user_email) => {
  const { userId } = auth();

  // Check if userId is available
  if (!userId) {
    throw new Error(ERRORS.AUTH_ERROR);
  }

  // Validate the `id` is a number
  const requirementId = parseInt(id);
  if (isNaN(requirementId)) {
    return {
      error: "Invalid requirement ID",
      status: STATUS_CODES.BAD_REQUEST,
    };
  }

  try {
    // Check if the invited user exists in Clerk
    const invitedUser = await clerk.users.getUserList({
      emailAddress: user_email, // Filter by email
      limit: 1, // Limit to one user
    });

    if (!invitedUser || invitedUser.length === 0) {
      return {
        error: "User with this email does not exist",
        status: STATUS_CODES.BAD_REQUEST,
      };
    }

    // Fetch the requirement record to ensure it exists and belongs to the current user
    const requirement = await prisma.requirement.findUnique({
      where: {
        id: requirementId,
      },
    });

    if (!requirement || requirement.user_id !== userId) {
      return {
        error: "Requirement not found or does not belong to the current user",
        status: STATUS_CODES.NOT_FOUND,
      };
    }

    // Update the `invite` array with the invited user's ID
    const updatedRequirement = await prisma.requirement.update({
      where: {
        id: requirementId,
      },
      data: {
        invite: { push: invitedUser[0].id }, // Assuming `invite` is a list of user IDs
      },
    });

    return {
      data: updatedRequirement,
      message: "Invite sent successfully",
      status: STATUS_CODES.SUCCESS,
    };
  } catch (e) {
    console.error("Error in inviteUser:", e);
    return {
      error: "An error occurred while sending the invite",
      status: STATUS_CODES.SERVER_ERROR,
    };
  }
};
