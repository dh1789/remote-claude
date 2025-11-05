/**
 * executor.ts 유닛 테스트
 * Unit tests for executor.ts
 *
 * 테스트 대상 (Test targets):
 * - sendArrowKey() - 방향키 전송 함수
 * - executeCommandSequence() - 명령 시퀀스 실행
 */

import { sendArrowKey, executeCommandSequence } from '../executor';
import { initLogger, clearLoggerInstance } from '../../utils/logger';
import { LogLevel } from '../../types';
import { ParsedSegment } from '../../dsl/parser';
import { exec } from 'child_process';

// child_process.exec 모킹
// Mock child_process.exec
jest.mock('child_process', () => ({
  exec: jest.fn(),
}));

const mockedExec = exec as jest.MockedFunction<typeof exec>;

// Logger 초기화
// Initialize logger before all tests
beforeAll(() => {
  initLogger(LogLevel.ERROR); // Use ERROR level to suppress logs during tests
});

// Logger 정리
// Clean up logger after all tests
afterAll(() => {
  clearLoggerInstance();
});

// 각 테스트 전에 모든 모킹 초기화
// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

describe('sendArrowKey()', () => {
  /**
   * Task 6.3.1: 정상 경로 - Down 키 성공적으로 전송
   * Happy Path - Successfully send Down key
   */
  describe('정상 경로 (Happy Path)', () => {
    it('should successfully send Down key', async () => {
      // Arrange
      const sessionName = 'test-session';
      const direction = 'Down';

      // exec 모킹 - 성공 시나리오
      // Mock exec for success scenario
      mockedExec.mockImplementation((_cmd: string, _options: any, callback: any) => {
        callback(null, { stdout: '', stderr: '' });
        return {} as any;
      });

      // Act
      const result = await sendArrowKey(sessionName, direction);

      // Assert
      expect(result.success).toBe(true);
      expect(mockedExec).toHaveBeenCalledTimes(1);

      // 올바른 tmux 명령이 호출되었는지 확인
      // Verify correct tmux command was called
      const callArgs = mockedExec.mock.calls[0][0];
      expect(callArgs).toContain('tmux send-keys');
      expect(callArgs).toContain('-t test-session');
      expect(callArgs).toContain('Down');
    });

    it('should successfully send Up key', async () => {
      const sessionName = 'test-session';
      const direction = 'Up';

      mockedExec.mockImplementation((_cmd: string, _options: any, callback: any) => {
        callback(null, { stdout: '', stderr: '' });
        return {} as any;
      });

      const result = await sendArrowKey(sessionName, direction);

      expect(result.success).toBe(true);
      expect(mockedExec).toHaveBeenCalledTimes(1);

      const callArgs = mockedExec.mock.calls[0][0];
      expect(callArgs).toContain('Up');
    });
  });

  /**
   * Task 6.3.2: 경계 조건 - 4가지 방향 모두 테스트
   * Boundary Conditions - Test all 4 directions
   */
  describe('경계 조건 (Boundary Conditions)', () => {
    it.each([
      ['Right', 'Right'],
      ['Left', 'Left'],
      ['Up', 'Up'],
      ['Down', 'Down'],
    ] as const)('should send %s key correctly', async (direction, expectedKey) => {
      // Arrange
      const sessionName = 'test-session';

      mockedExec.mockImplementation((_cmd: string, _options: any, callback: any) => {
        callback(null, { stdout: '', stderr: '' });
        return {} as any;
      });

      // Act
      const result = await sendArrowKey(sessionName, direction);

      // Assert
      expect(result.success).toBe(true);
      expect(mockedExec).toHaveBeenCalledTimes(1);

      const callArgs = mockedExec.mock.calls[0][0];
      expect(callArgs).toContain(`tmux send-keys -t ${sessionName} ${expectedKey}`);
    });

    it('should handle different session names', async () => {
      const sessionNames = ['my-session', 'test-123', 'session_name'];

      for (const sessionName of sessionNames) {
        jest.clearAllMocks();

        mockedExec.mockImplementation((_cmd: string, _options: any, callback: any) => {
          callback(null, { stdout: '', stderr: '' });
          return {} as any;
        });

        const result = await sendArrowKey(sessionName, 'Down');

        expect(result.success).toBe(true);
        const callArgs = mockedExec.mock.calls[0][0];
        expect(callArgs).toContain(`-t ${sessionName}`);
      }
    });
  });

  /**
   * Task 6.3.3: 예외 케이스 - 잘못된 세션 이름 오류 처리
   * Exception Cases - Handle invalid session name errors
   */
  describe('예외 케이스 (Exception Cases)', () => {
    it('should handle tmux command failure with invalid session', async () => {
      // Arrange
      const sessionName = 'non-existent-session';
      const direction = 'Down';

      // exec 모킹 - 실패 시나리오
      // Mock exec for failure scenario
      mockedExec.mockImplementation((_cmd: string, _options: any, callback: any) => {
        const error = new Error("can't find session: non-existent-session");
        callback(error, { stdout: '', stderr: "can't find session" });
        return {} as any;
      });

      // Act
      const result = await sendArrowKey(sessionName, direction);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain("can't find session");
    });

    it('should handle exec timeout error', async () => {
      const sessionName = 'test-session';
      const direction = 'Down';

      mockedExec.mockImplementation((_cmd: string, _options: any, callback: any) => {
        const error = new Error('Command timed out');
        (error as any).killed = true;
        callback(error, { stdout: '', stderr: '' });
        return {} as any;
      });

      const result = await sendArrowKey(sessionName, direction);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('timed out');
    });

    it('should handle unknown errors gracefully', async () => {
      const sessionName = 'test-session';
      const direction = 'Down';

      mockedExec.mockImplementation((_cmd: string, _options: any, callback: any) => {
        callback(new Error('Unknown error'), { stdout: '', stderr: '' });
        return {} as any;
      });

      const result = await sendArrowKey(sessionName, direction);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  /**
   * 추가 테스트 - 로깅 및 부작용 검증
   * Additional tests - Logging and side effects
   */
  describe('부작용 검증 (Side Effects)', () => {
    it('should not modify input parameters', async () => {
      const sessionName = 'test-session';
      const direction = 'Down';
      const originalSessionName = sessionName;
      const originalDirection = direction;

      mockedExec.mockImplementation((_cmd: string, _options: any, callback: any) => {
        callback(null, { stdout: '', stderr: '' });
        return {} as any;
      });

      await sendArrowKey(sessionName, direction);

      expect(sessionName).toBe(originalSessionName);
      expect(direction).toBe(originalDirection);
    });

    it('should call exec exactly once per invocation', async () => {
      mockedExec.mockImplementation((_cmd: string, _options: any, callback: any) => {
        callback(null, { stdout: '', stderr: '' });
        return {} as any;
      });

      await sendArrowKey('test-session', 'Down');

      expect(mockedExec).toHaveBeenCalledTimes(1);
    });
  });
});

describe('executeCommandSequence()', () => {
  /**
   * Task 6.4.1: 정상 경로 - [Down, Enter] 성공적으로 실행
   * Happy Path - Successfully execute [Down, Enter] sequence
   */
  describe('정상 경로 (Happy Path)', () => {
    it('should execute [Down, Enter] sequence successfully', async () => {
      // Arrange
      const sessionName = 'test-session';
      const commands: ParsedSegment[] = [
        { type: 'key', key: 'Down' },
        { type: 'key', key: 'Enter' },
      ];

      mockedExec.mockImplementation((_cmd: string, _options: any, callback: any) => {
        callback(null, { stdout: '', stderr: '' });
        return {} as any;
      });

      // Act
      const result = await executeCommandSequence(sessionName, commands, 10, 10);

      // Assert
      expect(result.success).toBe(true);
      expect(mockedExec).toHaveBeenCalledTimes(2); // Down + Enter

      // 첫 번째 호출: Down
      // First call: Down
      const firstCall = mockedExec.mock.calls[0][0];
      expect(firstCall).toContain('Down');

      // 두 번째 호출: Enter
      // Second call: Enter
      const secondCall = mockedExec.mock.calls[1][0];
      expect(secondCall).toContain('Enter');
    });

    it('should execute text and key commands in sequence', async () => {
      const sessionName = 'test-session';
      const commands: ParsedSegment[] = [
        { type: 'text', content: 'hello' },
        { type: 'key', key: 'Enter' },
      ];

      mockedExec.mockImplementation((_cmd: string, _options: any, callback: any) => {
        callback(null, { stdout: '', stderr: '' });
        return {} as any;
      });

      const result = await executeCommandSequence(sessionName, commands, 10, 10);

      expect(result.success).toBe(true);
      expect(mockedExec).toHaveBeenCalledTimes(2);

      const firstCall = mockedExec.mock.calls[0][0];
      expect(firstCall).toContain('-l'); // literal flag for text
      expect(firstCall).toContain('hello');
    });
  });

  /**
   * Task 6.4.2: 경계 조건 - 단일 키 명령
   * Boundary Conditions - Single key command
   */
  describe('경계 조건 (Boundary Conditions)', () => {
    it('should handle single key command', async () => {
      const sessionName = 'test-session';
      const commands: ParsedSegment[] = [{ type: 'key', key: 'Enter' }];

      mockedExec.mockImplementation((_cmd: string, _options: any, callback: any) => {
        callback(null, { stdout: '', stderr: '' });
        return {} as any;
      });

      const result = await executeCommandSequence(sessionName, commands, 10, 10);

      expect(result.success).toBe(true);
      expect(mockedExec).toHaveBeenCalledTimes(1);
    });

    it('should handle empty command sequence', async () => {
      const sessionName = 'test-session';
      const commands: ParsedSegment[] = [];

      mockedExec.mockImplementation((_cmd: string, _options: any, callback: any) => {
        callback(null, { stdout: '', stderr: '' });
        return {} as any;
      });

      const result = await executeCommandSequence(sessionName, commands, 10, 10);

      expect(result.success).toBe(true);
      expect(mockedExec).toHaveBeenCalledTimes(0);
    });

    it('should handle long command sequence', async () => {
      const sessionName = 'test-session';
      const commands: ParsedSegment[] = Array(10).fill({ type: 'key', key: 'Down' });

      mockedExec.mockImplementation((_cmd: string, _options: any, callback: any) => {
        callback(null, { stdout: '', stderr: '' });
        return {} as any;
      });

      const result = await executeCommandSequence(sessionName, commands, 10, 10);

      expect(result.success).toBe(true);
      expect(mockedExec).toHaveBeenCalledTimes(10);
    });
  });

  /**
   * Task 6.4.3: 예외 케이스 - 시퀀스 중간에 tmux 실패
   * Exception Cases - tmux failure in middle of sequence
   */
  describe('예외 케이스 (Exception Cases)', () => {
    it('should stop execution when command fails in middle of sequence', async () => {
      const sessionName = 'test-session';
      const commands: ParsedSegment[] = [
        { type: 'key', key: 'Down' },
        { type: 'key', key: 'Down' },
        { type: 'key', key: 'Enter' },
      ];

      let callCount = 0;
      mockedExec.mockImplementation((_cmd: string, _options: any, callback: any) => {
        callCount++;
        if (callCount === 2) {
          // 두 번째 명령에서 실패
          // Fail on second command
          callback(new Error('Session error'), { stdout: '', stderr: 'error' });
        } else {
          callback(null, { stdout: '', stderr: '' });
        }
        return {} as any;
      });

      const result = await executeCommandSequence(sessionName, commands, 10, 10);

      expect(result.success).toBe(false);
      expect(mockedExec).toHaveBeenCalledTimes(2); // Should stop after failure
      expect(result.error).toBeDefined();
    });

    it('should handle failure on first command', async () => {
      const sessionName = 'test-session';
      const commands: ParsedSegment[] = [
        { type: 'key', key: 'Down' },
        { type: 'key', key: 'Enter' },
      ];

      mockedExec.mockImplementation((_cmd: string, _options: any, callback: any) => {
        callback(new Error('Session not found'), { stdout: '', stderr: '' });
        return {} as any;
      });

      const result = await executeCommandSequence(sessionName, commands, 10, 10);

      expect(result.success).toBe(false);
      expect(mockedExec).toHaveBeenCalledTimes(1); // Should stop immediately
    });
  });
});
