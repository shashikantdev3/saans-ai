/**
 * Fails if the files git would commit add up to 10 MB or more, or any single file is over 1 MB.
 * Uses `git ls-files` (tracked plus untracked, minus .gitignore) so build output never counts.
 */
import { execFileSync } from 'node:child_process';
import { statSync } from 'node:fs';

const LIMIT_TOTAL = 10 * 1024 * 1024;
const LIMIT_FILE = 1024 * 1024;

const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], {
  encoding: 'utf8',
})
  .split('\n')
  .filter(Boolean);

let total = 0;
const large = [];
for (const file of files) {
  let size = 0;
  try {
    size = statSync(file).size;
  } catch {
    continue; // deleted but still in the index
  }
  total += size;
  if (size > LIMIT_FILE) large.push(`${file} (${(size / 1024).toFixed(0)} KB)`);
}

const mb = (total / 1024 / 1024).toFixed(2);
console.log(`Repo size: ${mb} MB across ${files.length} files`);
if (large.length) console.error(`Files over 1 MB:\n  ${large.join('\n  ')}`);
if (total >= LIMIT_TOTAL || large.length) {
  console.error('Repo size check failed (limit 10 MB total, 1 MB per file).');
  process.exit(1);
}
