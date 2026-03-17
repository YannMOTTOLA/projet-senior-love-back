import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import cors from "cors";
import { router as apiRouter } from "./router/index.router.js";
import { globalErrorHandler } from "./middleware/global-error-handler.middleware.js";
export const app = express();
/* ===== CORS (OBLIGATOIRE ET EN PREMIER) ===== */
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Accept"],
}));
/* ===== MIDDLEWARES ===== */
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(express.json());
app.use(cookieParser());
/* ===== ROUTES ===== */
app.use("/api", apiRouter);
/* ===== ERRORS ===== */
app.use(globalErrorHandler);
