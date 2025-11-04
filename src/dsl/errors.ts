/**
 * DSL 에러 정의 및 메시지 생성
 * DSL error definitions and message generation
 */

/**
 * 혼합 문자 에러 클래스
 * Mixed character error class
 *
 * 백틱 내용에 키 매핑 문자(r,l,u,d,e)와 일반 문자가 섞여있을 때 발생
 * Thrown when backtick content contains both key characters and regular characters
 */
export class MixedCharacterError extends Error {
  public readonly keyChars: string[];
  public readonly nonKeyChars: string[];

  constructor(keyChars: string[], nonKeyChars: string[]) {
    const message = `백틱 내용이 애매합니다: '${keyChars.join("', '")}' 는 키 매핑 문자이지만 '${nonKeyChars.join("', '")}'는 아닙니다`;
    super(message);

    this.name = 'MixedCharacterError';
    this.keyChars = keyChars;
    this.nonKeyChars = nonKeyChars;

    // Maintain proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, MixedCharacterError.prototype);
  }

  /**
   * 사용자 가이드 메시지 생성
   * Generate user guide message
   */
  public getUserGuide(): string {
    return (
      '키 명령과 텍스트를 각각 다른 백틱으로 감싸세요.\n\n' +
      '올바른 예시:\n' +
      `• \`ddd\` text \`e\` ✅ (키 명령과 텍스트 분리)\n\n` +
      '잘못된 예시:\n' +
      `• \`dddtext\` ❌ (키 문자와 일반 문자 혼합)`
    );
  }
}

/**
 * tmux 명령 실패 에러 클래스
 * tmux command failure error class
 */
export class TmuxCommandError extends Error {
  public readonly command: string;
  public readonly sessionName: string;
  public readonly exitCode?: number;

  constructor(
    message: string,
    command: string,
    sessionName: string,
    exitCode?: number
  ) {
    super(message);

    this.name = 'TmuxCommandError';
    this.command = command;
    this.sessionName = sessionName;
    this.exitCode = exitCode;

    Object.setPrototypeOf(this, TmuxCommandError.prototype);
  }

  /**
   * 사용자 가이드 메시지 생성
   * Generate user guide message
   */
  public getUserGuide(): string {
    return (
      'tmux 명령 실행에 실패했습니다.\n\n' +
      '다음 사항을 확인하세요:\n' +
      `• tmux 세션 \`${this.sessionName}\`이 실행 중인지 확인\n` +
      '• tmux가 설치되어 있는지 확인 (`tmux -V`)\n' +
      '• 세션이 응답하지 않으면 재시작 필요 (`tmux kill-session`)'
    );
  }
}

/**
 * tmux 타임아웃 에러 클래스
 * tmux timeout error class
 */
export class TmuxTimeoutError extends Error {
  public readonly sessionName: string;
  public readonly timeoutMs: number;

  constructor(sessionName: string, timeoutMs: number) {
    const message = `tmux 명령이 ${timeoutMs}ms 내에 완료되지 않았습니다 (세션: ${sessionName})`;
    super(message);

    this.name = 'TmuxTimeoutError';
    this.sessionName = sessionName;
    this.timeoutMs = timeoutMs;

    Object.setPrototypeOf(this, TmuxTimeoutError.prototype);
  }

  /**
   * 사용자 가이드 메시지 생성
   * Generate user guide message
   */
  public getUserGuide(): string {
    return (
      '명령 실행 시간이 초과되었습니다.\n\n' +
      '가능한 원인:\n' +
      '• 명령이 너무 오래 걸리고 있습니다\n' +
      '• 프로세스가 멈춰있거나 응답하지 않습니다\n' +
      '• 인터랙티브 프롬프트가 감지되지 않았습니다\n\n' +
      '해결 방법:\n' +
      '• 작업을 취소하고 다시 시도하세요 (`/cancel`)\n' +
      `• tmux 세션 \`${this.sessionName}\`을 직접 확인하세요`
    );
  }
}

/**
 * DSL 파싱 에러 클래스
 * DSL parsing error class
 */
export class DslParseError extends Error {
  public readonly input: string;
  public readonly position?: number;

  constructor(message: string, input: string, position?: number) {
    super(message);

    this.name = 'DslParseError';
    this.input = input;
    this.position = position;

    Object.setPrototypeOf(this, DslParseError.prototype);
  }

  /**
   * 사용자 가이드 메시지 생성
   * Generate user guide message
   */
  public getUserGuide(): string {
    return (
      'DSL 명령 파싱에 실패했습니다.\n\n' +
      'DSL 사용법:\n' +
      '• 키 명령: `ddd` (Down 3번), `uuu` (Up 3번), `e` (Enter)\n' +
      '• 텍스트 입력: `my-app` (텍스트로 전송)\n' +
      '• 혼합 사용: `ddd` my-app `e` (Down 3번 + 텍스트 + Enter)\n\n' +
      '주의사항:\n' +
      '• 키 문자(r,l,u,d,e)와 일반 문자를 같은 백틱에 넣지 마세요\n' +
      '• 빈 백틱은 사용하지 마세요'
    );
  }
}

/**
 * 세션 설정 에러 클래스
 * Session configuration error class
 */
export class SessionConfigError extends Error {
  public readonly channelId: string;

  constructor(message: string, channelId: string) {
    super(message);

    this.name = 'SessionConfigError';
    this.channelId = channelId;

    Object.setPrototypeOf(this, SessionConfigError.prototype);
  }

  /**
   * 사용자 가이드 메시지 생성
   * Generate user guide message
   */
  public getUserGuide(): string {
    return (
      '이 채널은 아직 프로젝트에 연결되지 않았습니다.\n\n' +
      '설정 방법:\n' +
      '1. `/setup <project-name> <project-path>` 명령어 실행\n' +
      '2. 프로젝트 이름과 경로 입력\n' +
      '3. 설정 완료 후 명령어 사용 가능\n\n' +
      '예시:\n' +
      '`/setup my-project /Users/username/projects/my-project`'
    );
  }
}

/**
 * 에러 타입 판별
 * Determine error type
 */
export function getErrorType(
  error: Error
): 'mixed-character' | 'tmux-command' | 'tmux-timeout' | 'dsl-parse' | 'session-config' | 'unknown' {
  if (error instanceof MixedCharacterError) {
    return 'mixed-character';
  }
  if (error instanceof TmuxCommandError) {
    return 'tmux-command';
  }
  if (error instanceof TmuxTimeoutError) {
    return 'tmux-timeout';
  }
  if (error instanceof DslParseError) {
    return 'dsl-parse';
  }
  if (error instanceof SessionConfigError) {
    return 'session-config';
  }
  return 'unknown';
}

/**
 * 에러 심각도 판별
 * Determine error severity
 */
export type ErrorSeverity = 'critical' | 'high' | 'medium' | 'low';

export function getErrorSeverity(error: Error): ErrorSeverity {
  if (error instanceof SessionConfigError) {
    return 'high'; // 설정 필요
  }
  if (error instanceof TmuxCommandError) {
    return 'high'; // 실행 실패
  }
  if (error instanceof TmuxTimeoutError) {
    return 'medium'; // 재시도 가능
  }
  if (error instanceof MixedCharacterError) {
    return 'low'; // 사용자 입력 문제
  }
  if (error instanceof DslParseError) {
    return 'low'; // 사용자 입력 문제
  }
  return 'medium'; // 알 수 없는 에러
}

/**
 * 에러 복구 가능 여부 판별
 * Determine if error is recoverable
 */
export function isRecoverableError(error: Error): boolean {
  if (error instanceof MixedCharacterError) {
    return true; // 사용자가 입력 수정 가능
  }
  if (error instanceof DslParseError) {
    return true; // 사용자가 입력 수정 가능
  }
  if (error instanceof TmuxTimeoutError) {
    return true; // 재시도 가능
  }
  if (error instanceof SessionConfigError) {
    return true; // 설정 후 재시도 가능
  }
  if (error instanceof TmuxCommandError) {
    return false; // 시스템 문제일 가능성
  }
  return false; // 알 수 없는 에러는 복구 불가로 간주
}
