import "dotenv/config";
import app from "./app.js";
import { startSyncFixtures } from "./jobs/syncFixtures.js";
import { startSyncLive } from "./jobs/syncLive.js";

const PORT = Number(process.env["PORT"] ?? 3000);

const server = app.listen(PORT, () => {
  console.log(` football-analytics-api running on http://localhost:${PORT}`);
  console.log(`   Provider : ${process.env["PROVIDER"] ?? "mock"}`);
  console.log(
    `   Client   : ${process.env["CLIENT_URL"] ?? "http://localhost:5173"}`,
  );

  startSyncFixtures();
  startSyncLive();
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down...");
  server.close(() => {
    console.log("Server closed.");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down...");
  server.close(() => {
    console.log("Server closed.");
    process.exit(0);
  });
});
