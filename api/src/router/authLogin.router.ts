import { Router } from "express";
import rateLimit from "express-rate-limit";
import { loginUser, refreshAccessToken } from "../controller/authLogin.controller.ts";

export const router = Router();

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10                  // Limit each IP to 10 requests per `window` (here, per minute)
});

router.post("/auth/login", limiter, loginUser);
router.post("/auth/refresh", refreshAccessToken);
