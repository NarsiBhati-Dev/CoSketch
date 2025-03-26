import {
  createCanvas,
  deleteCanvasShape,
  getCanvasShape,
  updateCanvasShape,
  // getRoomIfExists,
} from "@repo/database";

import { logger } from "../utils/logger";
import { rooms, broadcastToRoom, isUserInRoom } from "../utils/roomManager";
import { shapeSchema, type CanvasMessage } from "@repo/types";
import { WebSocket } from "ws";

export const handleCanvasEvent = async (
  socket: WebSocket,
  message: CanvasMessage,
  userId: string
) => {
  try {
    const { type, room, data } = message;

    // Check if the room exists in memory
    if (!room || !rooms[room]) {
      logger.warn(`Canvas event received for non-existent room: ${room}`);
      return;
    }

    // Check if user is in the room
    if (!isUserInRoom(socket, room)) {
      logger.warn(`User ${userId} is not in room ${room}. Ignoring event.`);
      return;
    }

    // Validate incoming shape data
    const parsedData = shapeSchema.safeParse(data);
    if (!parsedData.success) {
      logger.warn(
        `Invalid shape data from user ${userId}: ${JSON.stringify(parsedData.error.format())}`
      );
      return;
    }

    const shapeData = parsedData.data;

    switch (type) {
      case "draw_canvas":
        // Ensure the room exists in the database to prevent FK constraint errors
        // const existingRoom = await getRoomIfExists(room);
        // if (!existingRoom) {
        //   logger.warn(`Room ${room} does not exist in the database.`);
        //   return;
        // }

        try {
          await createCanvas({
            roomId: room,
            userId,
            design: shapeData,
          });

          logger.info(
            `User ${userId} drew a ${shapeData.type} at (${shapeData.x}, ${shapeData.y}) in room ${room}`
          );
          broadcastToRoom(
            room,
            { type: "draw_canvas", userId, data: shapeData },
            socket
          );
        } catch (dbError) {
          logger.error(`Database error while saving shape: ${dbError}`);
          return;
        }
        break;

      case "clear_canvas":
        logger.info(`User ${userId} cleared the canvas in room ${room}`);
        broadcastToRoom(
          room,
          {
            type: "clear_canvas",
            message: `User ${userId} cleared the canvas`,
          },
          socket
        );
        break;

      case "eraser":
        try {
          const { id: shapeId } = shapeData;

          if (!shapeId) {
            logger.warn(
              `User ${userId} attempted to erase without providing a shape ID.`
            );
            return;
          }

          // Fetch the shape to ensure it exists and belongs to the user
          const existingShape = await getCanvasShape(shapeId);

          if (!existingShape) {
            logger.warn(`Shape ${shapeId} not found in room ${room}`);
            return;
          }

          // Delete shape from database
          await deleteCanvasShape(shapeId);

          logger.info(`User ${userId} erased shape ${shapeId} in room ${room}`);

          // Notify other users to remove the shape from their canvas
          broadcastToRoom(
            room,
            {
              type: "eraser",
              userId,
              shapeId,
            },
            socket
          );
        } catch (dbError) {
          logger.error(`Database error while erasing shape: ${dbError}`);
        }
        break;
      case "update":
        try {
          const { id: shapeId, ...updateData } = data;

          if (!shapeId) {
            logger.warn(
              `User ${userId} attempted to update without providing a shape ID.`
            );
            return;
          }

          // Validate update data
          const parsedData = shapeSchema.partial().safeParse(updateData);
          if (!parsedData.success) {
            logger.warn(
              `Invalid update data from user ${userId}: ${JSON.stringify(parsedData.error.format())}`
            );
            return;
          }

          // Ensure shape exists in DB
          const existingShape = await getCanvasShape(shapeId);
          if (!existingShape) {
            logger.warn(`Shape ${shapeId} not found in room ${room}`);
            return;
          }

          // Perform the update in the database
          const updatedShape = await updateCanvasShape(shapeId, updateData);
          logger.info(
            `User ${userId} updated shape ${shapeId} in room ${room}`
          );

          // Broadcast update to all users in the room
          broadcastToRoom(
            room,
            {
              type: "update",
              userId,
              shapeId,
              data: updatedShape,
            },
            socket
          );
        } catch (dbError) {
          logger.error(`Database error while updating shape: ${dbError}`);
        }
        break;
      default:
        logger.warn(`Unknown canvas event type: ${type}`);
    }
  } catch (error) {
    logger.error(`Unexpected error handling canvas event: ${error}`);
  }
};
