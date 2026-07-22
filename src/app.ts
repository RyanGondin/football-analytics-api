// src/app.ts
import express from "express";
import type { Request, Response, NextFunction } from "express";
import cors from "cors";
import matchesRouter from "./routes/matches.js";
import playersRouter from "./routes/players.js";
import standingsRouter from "./routes/standings.js";

const app = express();

// --- Middleware ---

app.use(cors({
  origin: process.env['CLIENT_URL'] ?? "http://localhost:5173", // Vite default port
  methods: ["GET"],                                           // read-only API for now
}));

app.use(express.json());

// Simple request logger — useful during development
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// --- Routes ---

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", provider: process.env['PROVIDER'] ?? "mock" });
});

app.use("/matches",   matchesRouter);
app.use("/players",   playersRouter);
app.use("/standings", standingsRouter);

// --- 404 handler ---
// Catches any request that didn't match a route above
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Route not found" });
});

// --- Global error handler ---
// Any error passed to next(err) lands here
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[Unhandled error]", err.message);
  res.status(500).json({ error: "Internal server error" });
});

export default app;