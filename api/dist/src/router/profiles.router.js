import { Router } from "express";
import { getUserAlike, getMyProfile, getProfileByShortId, updateProfile } from "../controller/profiles.controller.js";
import { allowRoles } from "../middleware/allow-roles.middleware.js";
export const router = Router();
router.get("/profiles/alike/:id", allowRoles(["member", "moderator", "admin"]), getUserAlike);
router.get("/profile/me", allowRoles(["member"]), getMyProfile);
router.get("/profile/:shortId", allowRoles(["member"]), getProfileByShortId);
router.patch("/profile", allowRoles(["member"]), updateProfile);
