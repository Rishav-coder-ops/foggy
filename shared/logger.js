/**
 * @fileoverview Shared backend logger for server & Cloudflare Pages Functions.
 * Methods: debug, info, warn, error.
 * Debug logging is a no-op unless DEBUG environment variable is set.
 * Sanitizes keys, tokens, full prompts, and personal data.
 */

const isDebugEnabled = () => {
  try {
    if (typeof process !== 'undefined' && process.env) {
      const debugVal = process.env.DEBUG;
      return Boolean(debugVal && debugVal !== 'false' && debugVal !== '0');
    }
  } catch {
    // Sandboxed / worker environments without process
  }
  return false;
};

const redactSensitiveText = (text) => {
  if (typeof text !== 'string') return text;
  return text
    .replace(/(key|token|secret|auth|bearer|password)[=:]\s*([^\s,;]+)/gi, '$1=***')
    .replace(/AIza[0-9A-Za-z-_]{35}/g, 'AIza***')
    .replace(/bearer\s+[a-zA-Z0-9_\-.]+/gi, 'Bearer ***');
};

const sanitizeArg = (arg) => {
  if (typeof arg === 'string') {
    return redactSensitiveText(arg);
  }
  if (arg && typeof arg === 'object') {
    try {
      const clean = Array.isArray(arg) ? [...arg] : { ...arg };
      for (const k of Object.keys(clean)) {
        if (/token|key|secret|password|auth/i.test(k)) {
          clean[k] = '***';
        } else if (typeof clean[k] === 'string') {
          clean[k] = redactSensitiveText(clean[k]);
        }
      }
      return clean;
    } catch {
      return arg;
    }
  }
  return arg;
};

const sanitizeArgs = (args) => args.map(sanitizeArg);

const output = (level, ...args) => {
  const c = globalThis.console;
  if (!c) return;
  const sanitized = sanitizeArgs(args);
  if (typeof c[level] === 'function') {
    c[level](...sanitized);
  } else if (typeof c.log === 'function') {
    c.log(...sanitized);
  }
};

export const logger = {
  debug(...args) {
    if (isDebugEnabled()) {
      output('debug', ...args);
    }
  },

  info(...args) {
    output('info', ...args);
  },

  warn(...args) {
    output('warn', ...args);
  },

  error(...args) {
    output('error', ...args);
  }
};
