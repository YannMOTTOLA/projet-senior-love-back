import { Router } from "express";
import { logoutUser } from "../controller/authLogout.controller.ts";

export const router = Router();


router.post("/auth/logout", logoutUser);