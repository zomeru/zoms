import { spawnSync } from 'node:child_process';

const forwardedArgs = process.argv.slice(2).filter((arg) => arg !== '--runInBand');
const result = spawnSync(
  process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
  ['exec', 'vitest', 'run', ...forwardedArgs],
  {
    stdio: 'inherit',
    shell: false
  }
);

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
