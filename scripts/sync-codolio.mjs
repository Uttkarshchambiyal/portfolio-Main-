// Refreshes data/codolio.json, the problem-solving snapshot bundled into the site.
// Runs before every build; the page also refreshes it live in the browser.
// If Codolio can't be reached, the existing snapshot is kept and the build goes on.
import { writeFile, mkdir } from 'node:fs/promises';
import { CODOLIO_API, CODOLIO_USER, summarize } from '../codolio.js';

const out = new URL('../data/codolio.json', import.meta.url);

try {
  const res = await fetch(CODOLIO_API, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = summarize(await res.json());
  if (!data) throw new Error('no solved problems in the response');
  await mkdir(new URL('.', out), { recursive: true });
  await writeFile(out, `${JSON.stringify(data, null, 2)}\n`);
  const by = data.platforms.filter((p) => p.solved).map((p) => `${p.name} ${p.solved}`).join(', ');
  console.log(`codolio: ${data.total} problems for ${CODOLIO_USER} (${by})`);
} catch (err) {
  console.warn(`codolio: kept the existing snapshot (${err.message})`);
}
