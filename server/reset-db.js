import { rmSync } from "node:fs";
rmSync("data/juris.db", { force: true });
rmSync("data/juris.db-shm", { force: true });
rmSync("data/juris.db-wal", { force: true });
await import("./db.js").then(({ seedIfEmpty }) => seedIfEmpty());
console.log("SQLite database reset and seeded.");
