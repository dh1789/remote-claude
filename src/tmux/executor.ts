/**
 * tmux 명령 실행 유틸리티
 * tmux command execution utility
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { TmuxCommandResult } from '../types';
import { getLogger } from '../utils/logger';

const execAsync = promisify(exec);

/**
 * tmux 명령 실행
 * Execute tmux command
 *
 * @param command - tmux command to execute
 * @param timeout - Command timeout in milliseconds (default: 30000ms = 30s)
 * @returns TmuxCommandResult with success status, output, and error
 */
export async function executeTmuxCommand(
  command: string,
  timeout: number = 30000
): Promise<TmuxCommandResult> {
  const logger = getLogger();

  try {
    logger.debug(`Executing tmux command: ${command}`);

    const { stdout, stderr } = await execAsync(command, {
      timeout,
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });

    if (stderr && stderr.trim().length > 0) {
      logger.warn(`tmux command stderr: ${stderr}`);
    }

    logger.debug(`tmux command output: ${stdout.slice(0, 200)}...`);

    return {
      success: true,
      output: stdout,
      error: stderr || undefined,
    };
  } catch (error) {
    logger.error(`tmux command failed: ${error}`);

    if (error instanceof Error) {
      return {
        success: false,
        output: '',
        error: error.message,
      };
    }

    return {
      success: false,
      output: '',
      error: 'Unknown error occurred',
    };
  }
}

/**
 * tmux 세션이 존재하는지 확인
 * Check if tmux session exists
 *
 * @param sessionName - tmux session name
 * @returns true if session exists, false otherwise
 */
export async function sessionExists(sessionName: string): Promise<boolean> {
  const result = await executeTmuxCommand(`tmux has-session -t ${sessionName}`);
  return result.success;
}

/**
 * tmux 세션 목록 가져오기
 * Get list of tmux sessions
 *
 * @returns Array of session names
 */
export async function listSessions(): Promise<string[]> {
  const result = await executeTmuxCommand('tmux list-sessions -F "#{session_name}"');

  if (!result.success || !result.output) {
    return [];
  }

  return result.output
    .trim()
    .split('\n')
    .filter((name) => name.length > 0);
}

/**
 * tmux 세션 생성
 * Create new tmux session
 *
 * @param sessionName - Session name
 * @param workingDirectory - Working directory for the session
 * @returns TmuxCommandResult
 */
export async function createSession(
  sessionName: string,
  workingDirectory: string
): Promise<TmuxCommandResult> {
  const command = `tmux new-session -d -s ${sessionName} -c "${workingDirectory}"`;
  return executeTmuxCommand(command);
}

/**
 * tmux 세션 종료
 * Kill tmux session
 *
 * @param sessionName - Session name
 * @returns TmuxCommandResult
 */
export async function killSession(sessionName: string): Promise<TmuxCommandResult> {
  const command = `tmux kill-session -t ${sessionName}`;
  return executeTmuxCommand(command);
}

/**
 * tmux 세션에 키 입력 전송
 * Send keys to tmux session
 *
 * @param sessionName - Session name
 * @param keys - Keys to send
 * @param literal - If true, send keys literally without interpreting special characters
 * @returns TmuxCommandResult
 */
export async function sendKeys(
  sessionName: string,
  keys: string,
  literal: boolean = true
): Promise<TmuxCommandResult> {
  // 리터럴 모드인 경우 -l 플래그 사용
  const literalFlag = literal ? '-l' : '';

  // 키 입력 이스케이프 처리
  const escapedKeys = keys.replace(/"/g, '\\"');

  const command = `tmux send-keys -t ${sessionName} ${literalFlag} "${escapedKeys}"`;
  return executeTmuxCommand(command);
}

/**
 * tmux 세션에 Enter 키 전송
 * Send Enter key to tmux session
 *
 * @param sessionName - Session name
 * @returns TmuxCommandResult
 */
export async function sendEnter(sessionName: string): Promise<TmuxCommandResult> {
  const command = `tmux send-keys -t ${sessionName} Enter`;
  return executeTmuxCommand(command);
}

/**
 * tmux 세션 출력 캡처
 * Capture pane output from tmux session
 *
 * @param sessionName - Session name
 * @param startLine - Start line (negative for last N lines)
 * @param endLine - End line (optional)
 * @returns TmuxCommandResult with captured output
 */
export async function capturePane(
  sessionName: string,
  startLine?: number,
  endLine?: number
): Promise<TmuxCommandResult> {
  let command = `tmux capture-pane -t ${sessionName} -p`;

  if (startLine !== undefined) {
    command += ` -S ${startLine}`;
  }

  if (endLine !== undefined) {
    command += ` -E ${endLine}`;
  }

  return executeTmuxCommand(command);
}

/**
 * tmux 세션의 스크롤백 버퍼 지우기
 * Clear scrollback buffer of tmux session
 *
 * @param sessionName - Session name
 * @returns TmuxCommandResult
 */
export async function clearHistory(sessionName: string): Promise<TmuxCommandResult> {
  const command = `tmux clear-history -t ${sessionName}`;
  return executeTmuxCommand(command);
}

/**
 * tmux 세션 정보 가져오기
 * Get tmux session info
 *
 * @param sessionName - Session name
 * @returns Session info or null if session doesn't exist
 */
export async function getSessionInfo(
  sessionName: string
): Promise<{ name: string; created: string; attached: boolean } | null> {
  const command = `tmux list-sessions -F "#{session_name}|#{session_created}|#{session_attached}" | grep "^${sessionName}|"`;
  const result = await executeTmuxCommand(command);

  if (!result.success || !result.output) {
    return null;
  }

  const [name, created, attached] = result.output.trim().split('|');

  return {
    name,
    created,
    attached: attached === '1',
  };
}
