import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { allWorkspace } from "../server/db.js";

const output = resolve("src/data/demo-workspace.json");

await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(allWorkspace(), null, 2)}\n`);

console.log(`Demo workspace exported to ${output}`);
