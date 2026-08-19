import cron from 'node-cron';
import { createProvider } from '../providers/index.js';

const LEAGUE_ID = process.env["LEAGUE_ID"] ?? "94"

let isMatchDayActive = false;

async function syncLive() {

    try{
        const provider = await createProvider();
        const liveMatches = await provider.getLiveMatches(LEAGUE_ID);

        if (liveMatches.length === 0) {
        if (isMatchDayActive) {
            console.log("[syncLive] No live matches — match window closed");
            isMatchDayActive = false;
        }
        return;
        }

        if (!isMatchDayActive) {
        console.log("[syncLive] Live matches detected — match window opened");
        isMatchDayActive = true;
        }

        console.log(`[syncLive] ${liveMatches.length} live match(es):`);
    for (const match of liveMatches) {
      console.log(
        `  ${match.homeTeam.shortName} ${match.homeScore ?? 0} - ${match.awayScore ?? 0} ${match.awayTeam.shortName} (${match.minute ?? 0}')`
      );
        }

    }catch (error) {
        console.error(`[syncLive] Failed: ${error}`);
    }
    
}

export function startSyncLive() {
  setTimeout(() => {
    cron.schedule("*/2 * * * *", syncLive);
    console.log("[syncLive] Scheduled — every 2 minutes");
  }, 30_000);
}