const { readdir, rm, stat } = require('node:fs').promises;
const { join } = require('node:path');
(async () => {
  const root = 'tmp';
  let removed = 0;
  try {
    for (const name of await readdir(root)) {
      const p = join(root, name);
      try {
        const s = await stat(p);
        if (s.isFile() && name.endsWith('.csv')) { await rm(p, { force: true }); removed++; }
      } catch {}
    }
  } catch {}
  console.log(`Cleaned ${removed} CSV file(s) from tmp/`);
})();
