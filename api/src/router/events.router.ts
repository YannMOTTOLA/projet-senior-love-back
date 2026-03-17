import { Router } from "express";
import { allowRoles } from "../middleware/allow-roles.middleware.ts";
import { createEvent, joinEvent, leaveEvent, listEvents } from "../controller/events.controller.ts";

export const router = Router();

router.get("/events", allowRoles(["member", "organization"]), listEvents);
router.post("/events", allowRoles(["member", "organization"]), createEvent);
router.post("/events/:eventId/join", allowRoles(["member", "organization"]), joinEvent);
router.delete("/events/:eventId/join", allowRoles(["member", "organization"]), leaveEvent);
