import { Router } from "express";
import {
  createStudent,
  getStudents,
} from "../controllers/studentController.js";

const router = Router();

router.get("/", getStudents);
router.post("/", createStudent);

export default router;
