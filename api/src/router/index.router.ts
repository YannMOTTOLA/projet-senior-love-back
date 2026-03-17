// import path from "node:path";

import { Router } from "express";
// import { healthCheck } from "../controllers/main.controller.ts";
import { router as authRegisterMemberRouter } from "./authRegisterMember.router.ts";
import { router as authLoginUser } from "./authLogin.router.ts";
import { router as authLogoutUser } from "./authLogout.router.ts";
import { router as profilesRouter } from "./profiles.router.ts";
import { router as BackOfficeRouter } from "./backOffice.router.ts"
import { router as authRegisterOrganisationRouter } from "./authRegisterOrganisation.router.ts";
import { router as messagesRouter } from "./messages.router.ts";
import { router as createEvent } from "./createEvent.router.ts";
import { router as citiesRouter } from "./cities.router.ts";
import { router as eventsRouter } from "./events.router.ts";


export const router = Router();

// Routeurs
router.use(authLogoutUser);
router.use(authRegisterMemberRouter);
router.use(authLoginUser);
router.use(profilesRouter);
router.use(BackOfficeRouter);
router.use(authRegisterOrganisationRouter);
router.use(messagesRouter);
router.use(createEvent);
router.use(citiesRouter);
router.use(eventsRouter);

