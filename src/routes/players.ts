import { Router } from "express";
import type { Request, Response } from "express";
import { PlayersService } from "../services/playersService.js";

const router = Router();

router.get("/:id", async (req: Request, res: Response) => {
    try{
        const {season} = req.query;
        const playersService = new PlayersService();

        if(!season){
            return res.status(400).json({error: "Season query parameter is required"});
        }

        const stats = await playersService.getPlayerStats(String(req.params["id"]), String(season));

        if(!stats){
            return res.status(404).json({error: "Player stats not found"});
        }

        return res.json({data: stats});
    }catch (error) {
        console.error("[GET /players/:id]", error);
        return res.status(500).json({error: "Failed to fetch player stats"});
    }
});

router.get("/:id/compare", async (req: Request, res: Response) => {
    try{
        const {season, compareId} = req.query;
        const playersService = new PlayersService();

        if(!season || !compareId){
            return res.status(400).json({error: "Season and compareId query parameters are required"});
        }

        const [statsA, statsB] = await Promise.all([
            playersService.getPlayerStats(String(req.params["id"]), String(season)),
            playersService.getPlayerStats(String(compareId), String(season)),
        ]);

        if(!statsA || !statsB){
            return res.status(404).json({error: "One or both players' stats not found"});
        }

        return res.json({data: {playerA: statsA, playerB: statsB}});
    }catch (error) {
        console.error("[GET /players/:id/compare]", error);
        return res.status(500).json({error: "Failed to fetch player comparison stats"});
    }
});

export default router;