import { Router } from "express";
import { logoutUser } from "../controller/authLogout.controller.js";
export const router = Router();
router.post("/auth/logout", logoutUser);
