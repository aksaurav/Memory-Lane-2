import express from "express";

import {
  recognizeOrRegister,
  updateMemory,
} from "../controllers/identityController.js";

const router = express.Router();

router.post("/recognize", recognizeOrRegister);
router.put("/update-memory", updateMemory);

export default router;
