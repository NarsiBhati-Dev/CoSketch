import expres from "express";
import {
  CreateRoom,
  joinRoom,
  leaveRoom,
  Rooms,
} from "../controllers/room.controller";

import { auth } from "../middleware/auth";

const router = expres.Router();

router.use(auth);

router.post("/create-room", CreateRoom);
router.post("/join-room/:roomId", joinRoom);
router.post("/leave-room/:roomId", leaveRoom);

router.get("/rooms", Rooms);

export default router;
