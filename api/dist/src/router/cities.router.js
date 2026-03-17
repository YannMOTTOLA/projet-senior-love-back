import { Router } from "express";
import { searchCities } from "../controller/cities.controller.js";
export const router = Router();
router.get("/cities/search", searchCities);
