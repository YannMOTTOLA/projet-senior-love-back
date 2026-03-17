import { Router } from "express";
import { getUserAlike, getMyProfile, getProfileByShortId, updateProfile, deleteProfile } from "../controller/profiles.controller.ts"
import { allowRoles } from "../middleware/allow-roles.middleware.ts";

export const router = Router();

router.get("/profiles/alike/:id", allowRoles(["member", "moderator", "admin"]), getUserAlike);
router.get("/profile/me", allowRoles(["member", "organization"]), getMyProfile);
router.get("/profile/:shortId", allowRoles(["member"]), getProfileByShortId);
router.patch("/profile", allowRoles(["member"]), updateProfile);
router.delete("/profile", allowRoles(["member"]), deleteProfile);
