import cron from 'node-cron';
import { createProvider } from '../providers/index.js';

const LEAGUE_ID = process.env["LEAGUE_ID"] ?? "94"
const SEASON = process.env["SEASON"] ?? "2024"

async function sync() {
    console.log(`[syncFixtures] Starting sync — league ${LEAGUE_ID}, season ${SEASON}`);

    try {
        const provider = await createProvider();
        const fixtures = await provider.getFixtures(LEAGUE_ID, SEASON);

        console.log(`[syncFixtures] Fetched ${fixtures.length} fixtures`);

        console.log('[syncFixtures] Done');
    }catch (error) {
        console.error(`[syncFixtures] Failed: ${error}`);
    }

}

export function startSyncFixtures(){
    sync();
    cron.schedule("0 */6 * * *", sync);
    console.log("[syncFixtures] Scheduled sync every 6 hours");
}
