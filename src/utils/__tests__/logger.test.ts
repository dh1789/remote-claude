/**
 * Logger utility tests
 */

import { initLogger, getLogger, setLogLevel, clearLoggerInstance } from '../logger';
import { LogLevel } from '../../types';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

describe('Logger Utilities', () => {
  let tempLogDir: string;

  beforeEach(() => {
    // Create temporary log directory
    tempLogDir = fs.mkdtempSync(path.join(os.tmpdir(), 'logger-test-'));
    // Initialize logger before each test
    initLogger(LogLevel.INFO, tempLogDir);
  });

  afterEach(() => {
    // Clear logger instance after each test
    clearLoggerInstance();
    // Clean up temporary directory
    if (fs.existsSync(tempLogDir)) {
      fs.rmSync(tempLogDir, { recursive: true, force: true });
    }
  });

  describe('getLogger', () => {
    it('should return a logger instance', () => {
      const logger = getLogger();
      expect(logger).toBeDefined();
      expect(logger.info).toBeDefined();
      expect(logger.error).toBeDefined();
      expect(logger.warn).toBeDefined();
      expect(logger.debug).toBeDefined();
    });

    it('should return the same instance on multiple calls', () => {
      const logger1 = getLogger();
      const logger2 = getLogger();
      expect(logger1).toBe(logger2);
    });

    it('should have default log level info', () => {
      const logger = getLogger();
      expect(logger.level).toBe('info');
    });
  });

  describe('setLogLevel', () => {
    it('should change log level to debug', () => {
      const logger = getLogger();
      setLogLevel(LogLevel.DEBUG);
      expect(logger.level).toBe('debug');
    });

    it('should change log level to warn', () => {
      const logger = getLogger();
      setLogLevel(LogLevel.WARN);
      expect(logger.level).toBe('warn');
    });

    it('should change log level to error', () => {
      const logger = getLogger();
      setLogLevel(LogLevel.ERROR);
      expect(logger.level).toBe('error');
    });

    it('should change log level back to info', () => {
      const logger = getLogger();
      setLogLevel(LogLevel.DEBUG);
      expect(logger.level).toBe('debug');

      setLogLevel(LogLevel.INFO);
      expect(logger.level).toBe('info');
    });
  });

  describe('logging methods', () => {
    it('should not throw when logging at different levels', () => {
      const logger = getLogger();

      expect(() => logger.info('Info message')).not.toThrow();
      expect(() => logger.error('Error message')).not.toThrow();
      expect(() => logger.warn('Warn message')).not.toThrow();
      expect(() => logger.debug('Debug message')).not.toThrow();
    });

    it('should handle logging with metadata', () => {
      const logger = getLogger();

      expect(() => logger.info('Message with metadata', { key: 'value' })).not.toThrow();
      expect(() => logger.error('Error with metadata', { error: new Error('test') })).not.toThrow();
    });

    it('should handle logging errors', () => {
      const logger = getLogger();
      const error = new Error('Test error');

      expect(() => logger.error('Error occurred', error)).not.toThrow();
      expect(() => logger.error(error)).not.toThrow();
    });
  });
});
