import { browser, dev } from '$app/environment';

export function log(message: string, data?: any) {
  const fullMessage = data ? `${message} ${JSON.stringify(data)}` : message;
  
  // Always console in browser
  if (browser) {
    console.log(`[CLIENT] ${fullMessage}`);
  }
  
  // In dev, also send to server log file
  if (dev && browser) {
    // Fire and forget
    fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: fullMessage, level: 'CLIENT' }),
      keepalive: true
    }).catch(() => {
      // Ignore log errors
    });
  }
}

// Convenience
export const info = log;
export const warn = (msg: string, data?: any) => {
  const full = data ? `${msg} ${JSON.stringify(data)}` : msg;
  console.warn(`[CLIENT] ${full}`);
  if (dev && browser) {
    fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: full, level: 'WARN' }),
      keepalive: true
    }).catch(() => {});
  }
};

export const error = (msg: string, data?: any) => {
  const full = data ? `${msg} ${JSON.stringify(data)}` : msg;
  console.error(`[CLIENT] ${full}`);
  if (dev && browser) {
    fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: full, level: 'ERROR' }),
      keepalive: true
    }).catch(() => {});
  }
};
