import { Router } from "express";
import { getCurrentUser, signIn, signUp } from "../controllers/authController.js";

const router = Router();

router.post("/signup", signUp);
router.post("/signin", signIn);
router.get("/me", getCurrentUser);

export default router;