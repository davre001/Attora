// Runs before each test file's module graph loads, so config's requireEnv()
// checks pass and src/db opens an isolated in-memory database instead of
// touching a real file (also sidesteps the WAL-file Windows-locking issues
// hit repeatedly during manual smoke testing this project).
process.env.VAULT_ADDRESS ??= '0x0000000000000000000000000000000000000001';
process.env.CC3_RPC_URL ??= 'http://127.0.0.1:1';
process.env.DB_PATH = ':memory:';
