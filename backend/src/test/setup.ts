import { afterAll, mock } from "bun:test";

/**
 * Test isolation setup (preloaded by bunfig.toml for `bun test`).
 *
 * Restores all mocks after each test FILE. Test files spy on shared singletons
 * (db, services); leaked mocks poison every later file in the same process.
 *
 * Table truncation between runs is handled by `src/test/truncate.ts` (invoked
 * by the `test` npm script), which refuses to touch non-test databases.
 */
afterAll(() => {
    mock.restore();
});
