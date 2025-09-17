import type { Response } from "express";
import { HttpStatus } from "../utils/HttpStatus";
import { CreateRoomSchema } from "@repo/types";
import type { AuthRequest } from "../utils/request-type";
import {
  connectUserWithRoom,
  createRoom,
  deleteRoom,
  getRoomByName,
  getRoomByRoomId,
  getRoomsByUserId,
  getRoomWithUsers,
  getRoomWithUsersById,
  removeUserFromRoom,
} from "@repo/database";

export const CreateRoom = async (req: AuthRequest, res: Response) => {
  try {
    // Validate request body
    const parsedData = CreateRoomSchema.safeParse(req.body);
    if (!parsedData.success) {
      res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        error: "Invalid Room Name",
      });
      return;
    }

    const { roomName } = parsedData.data;

    // Ensure user is authenticated
    const userId = req.auth?.id;
    if (!userId) {
      res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        error: "User authentication failed.",
      });
      return;
    }

    // Check if room already exists
    const existingRoom = await getRoomByName(roomName);
    if (existingRoom) {
      res.status(HttpStatus.CONFLICT).json({
        success: false,
        error: "Room already exists",
      });
      return;
    }

    // Create the room
    const room = await createRoom(roomName, userId);
    if (!room) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: "Failed to create the room. Please try again later.",
      });
      return;
    }

    res.status(HttpStatus.CREATED).json({
      success: true,
      message: "Room Created Successfully",
      roomId: room.id,
      slug: room.slug,
    });
    return;
  } catch (error) {
    console.error("Error creating room:", error);
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: "Something went wrong while creating the room.",
    });
    return;
  }
};

// Joining a room
export const joinRoom = async (req: AuthRequest, res: Response) => {
  const userId = req.auth?.id;
  const { roomId } = req.body;

  if (!userId) {
    res.status(HttpStatus.UNAUTHORIZED).json({
      success: false,
      error: "User not authenticated. Please log in.",
    });
    return;
  }

  if (!roomId) {
    res.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      error: "Room ID is required.",
    });
    return;
  }

  try {
    const room = await getRoomWithUsers(roomId);

    if (!room) {
      res.status(HttpStatus.NOT_FOUND).json({
        success: false,
        error: "Room doesn't exist",
      });
      return;
    }

    // Check if the user is already a member
    const isAlreadyMember = room.users.some((user) => user.id === userId);

    if (!isAlreadyMember) {
      await connectUserWithRoom(roomId, userId);
    }

    res.status(HttpStatus.OK).json({
      success: true,
      message: "Room joined successfully.",
      roomId,
    });
    return;
  } catch (error) {
    console.error("Error joining room:", error);

    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: "Failed to join the room.",
    });
    return;
  }
};

export const VerifyUserInRoom = async (req: AuthRequest, res: Response) => {
  const userId = req.auth?.id;
  const { roomId } = req.body;

  if (!userId) {
    res
      .status(HttpStatus.UNAUTHORIZED)
      .json({ success: false, error: "Unauthorized" });
    return;
  }

  if (!roomId) {
    res
      .status(HttpStatus.BAD_REQUEST)
      .json({ success: false, message: "Room ID required" });
    return;
  }

  try {
    const room = await getRoomByRoomId(roomId);

    if (!room) {
      res.status(HttpStatus.NOT_FOUND).json({ message: "Room not found" });
      return;
    }

    const isUserInRoom = room.users.some((user) => user.id === userId);
    if (!isUserInRoom) {
      res.status(403).json({ message: "Access denied. Not in this room." });
      return;
    }

    res
      .status(HttpStatus.OK)
      .json({ success: true, message: "User is in the room" });
    return;
  } catch {
    res
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Server error" });
    return;
  }
};

// Leaving a room
export const leaveRoom = async (req: AuthRequest, res: Response) => {
  const userId = req.auth?.id;
  const { roomId } = req.body;

  if (!userId) {
    res
      .status(HttpStatus.UNAUTHORIZED)
      .json({ success: false, error: "Unauthorized" });
    return;
  }

  if (!roomId) {
    res
      .status(HttpStatus.BAD_REQUEST)
      .json({ success: false, message: "Room ID required" });
    return;
  }

  try {
    const room = await getRoomWithUsersById(roomId);
    if (!room) {
      res
        .status(HttpStatus.NOT_FOUND)
        .json({ success: false, message: "Room not found." });
      return;
    }

    if (room.adminId === userId) {
      await deleteRoom(roomId);
      res
        .status(HttpStatus.OK)
        .json({ success: true, message: "Room deleted." });
      return;
    }

    await removeUserFromRoom(roomId, userId);
    res
      .status(HttpStatus.OK)
      .json({ success: true, message: "Left the room." });
    return;
  } catch {
    res
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json({ success: false, error: "Server error." });
    return;
  }
};

export const getRooms = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.auth?.id;

    if (!userId) {
      res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        error: "User authentication failed.",
      });
      return;
    }

    const user = await getRoomsByUserId(userId);
    if (!user) {
      res.status(HttpStatus.NOT_FOUND).json({
        success: false,
        error: "User not found.",
      });
      return;
    }

    if (!user.rooms?.length) {
      res.status(HttpStatus.OK).json({
        success: true,
        message: "No rooms available.",
        data: {
          userName: user.name,
          rooms: [],
        },
      });
      return;
    }

    const formattedRooms = user.rooms.map((room) => ({
      roomId: room.id,
      slug: room.slug,
      createdAt: room.createdAt, // Sending raw timestamp
      participants: room.users.map((participant) => participant.name), // Correct relation key
      noOfParticipants: room.users.length, // Correct relation key
    }));

    res.status(HttpStatus.OK).json({
      success: true,
      message: "Rooms fetched successfully.",
      data: {
        userName: user.name,
        rooms: formattedRooms,
      },
    });
    return;
  } catch (error) {
    console.error("Error fetching rooms:", error);
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: "Internal server error.",
    });
    return;
  }
};
