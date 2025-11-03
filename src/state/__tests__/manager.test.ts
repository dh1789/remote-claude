/**
 * State Manager tests
 */

import { StateManager } from '../manager';
import { LogLevel } from '../../types';
import { initLogger, clearLoggerInstance } from '../../utils/logger';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('StateManager', () => {
  let tempDir: string;
  let stateManager: StateManager;

  beforeEach(() => {
    initLogger(LogLevel.ERROR); // Use ERROR level to suppress logs during tests

    // Create temporary directory for testing
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'state-test-'));
    const stateFile = path.join(tempDir, 'state.json');

    // Initialize state file
    fs.writeFileSync(
      stateFile,
      JSON.stringify({ sessions: {}, lastUpdated: new Date().toISOString() }, null, 2),
      'utf-8'
    );

    stateManager = new StateManager(tempDir);
  });

  afterEach(() => {
    clearLoggerInstance();

    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('setWaitingForResponse', () => {
    it('should set session to waiting state', () => {
      stateManager.setWaitingForResponse('C12345', true, 30);

      const session = stateManager.getSession('C12345');
      expect(session).toBeDefined();
      expect(session?.isWaitingForResponse).toBe(true);
      expect(session?.timeoutAt).toBeDefined();
    });

    it('should clear waiting state', () => {
      stateManager.setWaitingForResponse('C12345', true, 30);
      stateManager.setWaitingForResponse('C12345', false);

      const session = stateManager.getSession('C12345');
      expect(session?.isWaitingForResponse).toBe(false);
      expect(session?.timeoutAt).toBeUndefined();
    });

    it('should calculate timeout correctly', () => {
      const now = new Date();
      stateManager.setWaitingForResponse('C12345', true, 30);

      const session = stateManager.getSession('C12345');
      const timeoutDate = new Date(session!.timeoutAt!);
      const diffMinutes = (timeoutDate.getTime() - now.getTime()) / (1000 * 60);

      expect(diffMinutes).toBeGreaterThanOrEqual(29);
      expect(diffMinutes).toBeLessThanOrEqual(31);
    });
  });

  describe('isWaitingForResponse', () => {
    it('should return true when waiting', () => {
      stateManager.setWaitingForResponse('C12345', true, 30);
      expect(stateManager.isWaitingForResponse('C12345')).toBe(true);
    });

    it('should return false when not waiting', () => {
      expect(stateManager.isWaitingForResponse('C12345')).toBe(false);
    });

    it('should return false after clearing', () => {
      stateManager.setWaitingForResponse('C12345', true, 30);
      stateManager.setWaitingForResponse('C12345', false);
      expect(stateManager.isWaitingForResponse('C12345')).toBe(false);
    });
  });

  describe('setLastPrompt and setLastOutput', () => {
    it('should set last prompt', () => {
      stateManager.setLastPrompt('C12345', 'test prompt');

      const session = stateManager.getSession('C12345');
      expect(session?.lastPrompt).toBe('test prompt');
    });

    it('should set last output', () => {
      stateManager.setLastOutput('C12345', 'test output');

      const session = stateManager.getSession('C12345');
      expect(session?.lastOutput).toBe('test output');
    });

    it('should update existing session', () => {
      stateManager.setLastPrompt('C12345', 'prompt1');
      stateManager.setLastOutput('C12345', 'output1');

      const session = stateManager.getSession('C12345');
      expect(session?.lastPrompt).toBe('prompt1');
      expect(session?.lastOutput).toBe('output1');
    });
  });

  describe('getSession', () => {
    it('should return session data', () => {
      stateManager.setWaitingForResponse('C12345', true, 30);
      stateManager.setLastPrompt('C12345', 'test prompt');

      const session = stateManager.getSession('C12345');
      expect(session).toBeDefined();
      expect(session?.channelId).toBe('C12345');
      expect(session?.isWaitingForResponse).toBe(true);
      expect(session?.lastPrompt).toBe('test prompt');
    });

    it('should return undefined for non-existent session', () => {
      const session = stateManager.getSession('C99999');
      expect(session).toBeUndefined();
    });
  });

  describe('clearSession', () => {
    it('should reset session data', () => {
      stateManager.setWaitingForResponse('C12345', true, 30);
      stateManager.setLastPrompt('C12345', 'test prompt');
      const session = stateManager.getSession('C12345');
      expect(session?.isWaitingForResponse).toBe(true);
      expect(session?.lastPrompt).toBe('test prompt');

      stateManager.clearSession('C12345');
      const clearedSession = stateManager.getSession('C12345');
      expect(clearedSession).toBeDefined();
      expect(clearedSession?.isWaitingForResponse).toBe(false);
      expect(clearedSession?.lastPrompt).toBeUndefined();
      expect(clearedSession?.timeoutAt).toBeUndefined();
    });

    it('should not throw when clearing non-existent session', () => {
      expect(() => {
        stateManager.clearSession('C99999');
      }).not.toThrow();
    });
  });

  describe('hasTimedOut', () => {
    it('should return false for non-existent session', () => {
      expect(stateManager.hasTimedOut('C99999')).toBe(false);
    });

    it('should return false when not waiting', () => {
      stateManager.setLastPrompt('C12345', 'test');
      expect(stateManager.hasTimedOut('C12345')).toBe(false);
    });

    it('should return false when timeout not reached', () => {
      stateManager.setWaitingForResponse('C12345', true, 30);
      expect(stateManager.hasTimedOut('C12345')).toBe(false);
    });

    it('should return true when timeout reached', () => {
      stateManager.setWaitingForResponse('C12345', true, 30);

      const session = stateManager.getSession('C12345');
      // Manually set timeout to past
      const pastDate = new Date();
      pastDate.setMinutes(pastDate.getMinutes() - 31);
      session!.timeoutAt = pastDate.toISOString();

      expect(stateManager.hasTimedOut('C12345')).toBe(true);
    });
  });

  describe('findTimedOutSessions', () => {
    it('should find timed out sessions', () => {
      stateManager.setWaitingForResponse('C12345', true, 30);
      stateManager.setWaitingForResponse('C67890', true, 30);

      // Set C12345 to timed out
      const session1 = stateManager.getSession('C12345');
      const pastDate = new Date();
      pastDate.setMinutes(pastDate.getMinutes() - 31);
      session1!.timeoutAt = pastDate.toISOString();

      const timedOut = stateManager.findTimedOutSessions();
      expect(timedOut).toHaveLength(1);
      expect(timedOut[0].channelId).toBe('C12345');
    });

    it('should return empty array when no timeouts', () => {
      stateManager.setWaitingForResponse('C12345', true, 30);

      const timedOut = stateManager.findTimedOutSessions();
      expect(timedOut).toHaveLength(0);
    });
  });

  describe('getAllSessions', () => {
    it('should return all sessions', () => {
      stateManager.setLastPrompt('C12345', 'test1');
      stateManager.setLastPrompt('C67890', 'test2');

      const sessions = stateManager.getAllSessions();
      expect(sessions).toHaveLength(2);

      const channelIds = sessions.map((s) => s.channelId);
      expect(channelIds).toContain('C12345');
      expect(channelIds).toContain('C67890');
    });

    it('should return empty array when no sessions', () => {
      const sessions = stateManager.getAllSessions();
      expect(sessions).toHaveLength(0);
    });
  });

  describe('persistence', () => {
    it('should persist changes to file', () => {
      stateManager.setWaitingForResponse('C12345', true, 30);
      stateManager.setLastPrompt('C12345', 'test prompt');

      // Create new instance to verify persistence
      const newManager = new StateManager(tempDir);
      const session = newManager.getSession('C12345');

      expect(session).toBeDefined();
      expect(session?.isWaitingForResponse).toBe(true);
      expect(session?.lastPrompt).toBe('test prompt');
    });

    it('should persist session clearing', () => {
      stateManager.setLastPrompt('C12345', 'test');
      stateManager.setWaitingForResponse('C12345', true, 30);
      stateManager.clearSession('C12345');

      // Create new instance to verify persistence
      const newManager = new StateManager(tempDir);
      const clearedSession = newManager.getSession('C12345');
      expect(clearedSession).toBeDefined();
      expect(clearedSession?.isWaitingForResponse).toBe(false);
      expect(clearedSession?.lastPrompt).toBeUndefined();
    });
  });
});
