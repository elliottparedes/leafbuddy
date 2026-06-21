import { appendFile } from 'node:fs/promises';
import path from 'node:path';
import { existsSync, writeFileSync } from 'node:fs';

const logFile = path.join(process.cwd(), 'app.log');

// Ensure log file exists (sync for init)
if (!existsSync(logFile)) {
  writeFileSync(logFile, '');
}

export async function log(message: string, level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' | 'CLIENT' = 'INFO') {
  const timestamp = new Date().toISOString();
  const entry = `${timestamp} [${level}] ${message}\n`;

  // Always log to console
  if (level === 'ERROR') {
    console.error(entry.trim());
  } else {
    console.log(entry.trim());
  }

  // Append to app.log
  try {
    await appendFile(logFile, entry, 'utf8');
  } catch (err) {
    console.error('Failed to write to app.log:', err);
  }
}

// Convenience methods
export const info = (msg: string) => log(msg, 'INFO');
export const warn = (msg: string) => log(msg, 'WARN');
export const error = (msg: string) => log(msg, 'ERROR');
export const debug = (msg: string) => log(msg, 'DEBUG');
export const client = (msg: string) => log(msg, 'CLIENT');
