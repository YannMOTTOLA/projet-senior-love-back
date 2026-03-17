import { Router } from "express";
import rateLimit from "express-rate-limit";
import { registerUser, getAllInterests, verifyIfMailAlreadyExist } from "../controller/authRegisterMember.controller.js";
export const router = Router();
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 10
});
router.post("/auth/register", limiter, registerUser);
router.get("/auth/interests", getAllInterests);
router.get("/auth/email/:mail", limiter, verifyIfMailAlreadyExist);
