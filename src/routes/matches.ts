import { Router } from "express";
import type { Request, Response } from "express";
import { MatchesService } from "../services/matchService.js";

const router = Router();
const matchService = new MatchesService();

router.get("/", async (req: Request, res: Response) => {
  try {
    const leagueId = String(req.query["leagueId"] ?? process.env["LEAGUE_ID"] ?? "94");
    const season   = String(req.query["season"]   ?? process.env["SEASON"]    ?? "2024");

    const matches = await matchService.getFixtures(leagueId, season);
    return res.json({ data: matches, count: matches.length });
  } catch (err) {
    console.error("[GET /matches]", err);
    return res.status(500).json({ error: "Failed to fetch fixtures" });
  }
});

router.get("/live", async (req: Request, res: Response) => {
  try {
    const { leagueId } = req.query;

    if (!leagueId) {
      return res.status(400).json({ error: "leagueId is required" });
    }

    const matches = await matchService.getLiveMatches(String(leagueId));
    return res.json({ data: matches, count: matches.length });
  } catch (error) {
    console.error("Get /matches/live", error);
    return res.status(500).json({ error: "Failed to fetch live matches" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const matchId = String(req.params["id"]);
    const match = await matchService.getMatchById(matchId);

    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }

    return res.json({ data: match });
  } catch (err) {
    console.error("[GET /matches/:id]", err);
    return res.status(500).json({ error: "Failed to fetch match" });
  }
});

export default router;
