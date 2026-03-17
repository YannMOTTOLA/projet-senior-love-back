import { Router } from "express";
import { createEvent } from "../controller/createEvent.controller.ts";
import { allowRoles } from "../middleware/allow-roles.middleware.ts";

export const router = Router();

router.post("/event", allowRoles(["member", "organization"]), createEvent);
