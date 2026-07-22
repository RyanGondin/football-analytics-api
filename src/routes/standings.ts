import { Router } from "express";
import type { Request, Response } from "express";
import { StandingsService } from "../services/standingsService.js";

const router = Router();
const standingsService = new StandingsService();
router.get("/", async (req: Request, res: Response) => {
  try {
    const leagueId = String(req.query["leagueId"] ?? process.env["LEAGUE_ID"] ?? "94");
    const season   = String(req.query["season"]   ?? process.env["SEASON"]    ?? "2024");

    const standings = await standingsService.getStandings(leagueId, season);
    return res.json({ data: standings, count: standings.length });
  } catch (err) {
    console.error("[GET /standings]", err);
    return res.status(500).json({ error: "Failed to fetch standings" });
  }
});

export default router;