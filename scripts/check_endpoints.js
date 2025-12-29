#!/usr/bin/env node
/*
Simple diagnostics tool to probe endpoints and save a timestamped log.
Usage: node scripts/check_endpoints.js <url> [times] [delayMs]
Example: node scripts/check_endpoints.js https://cardapio2-production.up.railway.app 5 1000
*/
import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
if (args.length < 1) {
  console.error('Usage: node scripts/check_endpoints.js <url> [times] [delayMs]');
  process.exit(1);
}

const base = args[0].replace(/\/$/, '');
const times = Number(args[1] || 5);
const delayMs = Number(args[2] || 1000);
const endpoints = ['/', '/_health'];

const outDir = path.join(process.cwd(), 'diagnostics');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
const outFile = path.join(outDir, `diag-${new Date().toISOString().replace(/[:.]/g,'-')}.log`);

function now() { return new Date().toISOString(); }

async function probe(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    const text = await res.text();
    return { status: res.status, headers: Object.fromEntries(res.headers), bodySnippet: text.slice(0, 200) };
  } catch (err) {
    return { error: String(err) };
  } finally {
    clearTimeout(timeout);
  }
}

(async () => {
  const fd = fs.openSync(outFile, 'a');
  fs.appendFileSync(fd, `=== DIAGNOSTIC START ${now()} base=${base} times=${times} delayMs=${delayMs} ===\n`);
  for (let i=0;i<times;i++) {
    fs.appendFileSync(fd, `-- ITER ${i+1} ${now()} --\n`);
    for (const ep of endpoints) {
      const url = base + ep;
      fs.appendFileSync(fd, `PROBE ${url}\n`);
      const r = await probe(url);
      fs.appendFileSync(fd, JSON.stringify(r, null, 2) + '\n');
    }
    if (i < times-1) {
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  fs.appendFileSync(fd, `=== DIAGNOSTIC END ${now()} ===\n\n`);
  fs.closeSync(fd);
  console.log('Diagnostic written to', outFile);
})();
