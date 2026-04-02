import {
  type SpawnSyncOptions,
  type SpawnSyncOptionsWithStringEncoding,
  type SpawnSyncReturns,
  spawnSync
} from 'node:child_process';
import { config as loadEnv } from 'dotenv';

type PnpmOptions = Omit<SpawnSyncOptions, 'encoding'>;

export function loadScriptEnv(path: string): void {
  loadEnv({ path, override: false, quiet: true });
  loadEnv({ quiet: true });
}

export function requireDatabaseEnv(
  path: string
): NodeJS.ProcessEnv & { DATABASE_URL: string; DIRECT_URL: string } {
  if (!process.env.DATABASE_URL || !process.env.DIRECT_URL) {
    throw new Error(
      `DATABASE_URL and DIRECT_URL environment variables must be set to run this script. Please create a ${path} file with these variables or set them in your environment.`
    );
  }

  return {
    ...process.env,
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL
  };
}

export function createScriptEnv(): NodeJS.ProcessEnv {
  return {
    ...process.env
  };
}

export function runPnpm(command: string[], options?: PnpmOptions): SpawnSyncReturns<Buffer> {
  const result = spawnSync(process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm', command, {
    shell: false,
    ...options
  });

  if (result.error) {
    throw result.error;
  }

  return result;
}

export function runPnpmText(
  command: string[],
  options: SpawnSyncOptionsWithStringEncoding
): SpawnSyncReturns<string> {
  const result = spawnSync(process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm', command, {
    shell: false,
    ...options
  });

  if (result.error) {
    throw result.error;
  }

  return result;
}
