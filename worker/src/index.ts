import { startCollateralListener, stopCollateralListener } from './chain';
import { startProofPipeline, stopProofPipeline } from './proof';
import { startApiServer } from './api';
import { db } from './db';

async function main(): Promise<void> {
  await startCollateralListener();
  startProofPipeline();
  const server = startApiServer();

  let shuttingDown = false;
  const shutdown = async (signal: string): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`[worker] ${signal} received, shutting down`);

    stopProofPipeline();
    await stopCollateralListener();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    db.close();

    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((err) => {
  console.error('[worker] fatal startup error:', err);
  process.exit(1);
});
