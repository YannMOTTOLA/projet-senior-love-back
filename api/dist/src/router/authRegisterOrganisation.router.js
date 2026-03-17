import { Router } from "express";
import rateLimit from "express-rate-limit";
import { registerOrganisation, verifySiret, } from "../controller/authRegisterOrganisation.controller.js";
export const router = Router();
const organizationLimiter = rateLimit({
    windowMs: 60_000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
});
router.post("/auth/register/organization", organizationLimiter, registerOrganisation);
router.get("/organizations/verify-siret/:siret", organizationLimiter, verifySiret);
