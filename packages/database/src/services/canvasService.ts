import type { Shape } from "@repo/types";
import { client } from "..";

export const createCanvas = async ({
  roomId,
  userId,
  design,
}: {
  roomId: string;
  userId: string;
  design: Shape;
}) => {
  return await client.canvas.create({
    data: {
      roomId,
      userId,
      design,
    },
  });
};

export const deleteUserCanvasInRoom = async (
  roomid: string,
  userId: string
) => {
  const existingCanvas = await client.canvas.findFirst({
    where: { roomId: roomid, userId },
  });

  if (!existingCanvas) {
    return null;
  }

  return await client.canvas.deleteMany({ where: { roomId: roomid, userId } });
};

export const clearRoomCanvas = async (roomId: string) => {
  const existingCanvas = await client.canvas.findMany({
    where: { roomId },
  });

  if (existingCanvas.length === 0) {
    return null;
  }

  return await client.canvas.deleteMany({
    where: { roomId },
  });
};

export const getRoomCanvas = async (roomId: string) => {
  return await client.canvas.findMany({
    where: { roomId },
    take: 50,
    orderBy: { createdAt: "desc" },
  });
};

export const getCanvasShape = async (shapeId: number) => {
  return await client.canvas.findUnique({
    where: { id: shapeId },
  });
};

export const deleteCanvasShape = async (shapeId: number) => {
  return await client.canvas.delete({
    where: { id: shapeId },
  });
};

export const updateCanvasShape = async (shapeId: number, updateData: Shape) => {
  return await client.canvas.update({
    where: { id: shapeId },
    data: updateData,
  });
};
