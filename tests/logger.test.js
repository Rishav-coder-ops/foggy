import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from '../shared/logger.js';

describe('shared/logger.js - Backend Logger & Diagnostics', () => {
  const originalEnvDebug = process.env.DEBUG;

  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.DEBUG;
  });

  afterEach(() => {
    if (originalEnvDebug !== undefined) {
      process.env.DEBUG = originalEnvDebug;
    } else {
      delete process.env.DEBUG;
    }
  });

  it('logger.debug is a no-op when DEBUG environment variable is not set', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

    logger.debug('should not be logged');

    expect(logSpy).not.toHaveBeenCalled();
    expect(debugSpy).not.toHaveBeenCalled();
  });

  it('logger.debug logs when DEBUG environment variable is enabled', () => {
    process.env.DEBUG = 'true';
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

    logger.debug('test debug message');

    expect(debugSpy).toHaveBeenCalledWith('test debug message');
  });

  it('logger.info calls console.info', () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    logger.info('system startup');

    expect(infoSpy).toHaveBeenCalledWith('system startup');
  });

  it('logger.warn and logger.error call console.warn and console.error', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    logger.warn('warning notice');
    logger.error('error notice');

    expect(warnSpy).toHaveBeenCalledWith('warning notice');
    expect(errorSpy).toHaveBeenCalledWith('error notice');
  });

  it('sanitizes secrets, tokens, and api keys from logged strings', () => {
    process.env.DEBUG = 'true';
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

    logger.debug('Connecting with key=secret123 and token=my-secret-token');

    expect(debugSpy).toHaveBeenCalledWith('Connecting with key=*** and token=***');
  });
});
