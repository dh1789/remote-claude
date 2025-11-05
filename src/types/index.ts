/**
 * 공통 타입 정의
 * Remote Claude Code 제어 시스템을 위한 TypeScript 타입 정의
 */

/**
 * Slack 채널 설정
 */
export interface ChannelConfig {
  channelId: string;
  projectPath: string;
  projectName: string;
  tmuxSession: string;
  createdAt: string;
  lastUsed: string;
}

/**
 * 프로젝트 설정 (전체 config.json 구조)
 */
export interface Config {
  channels: {
    [channelId: string]: ChannelConfig;
  };
}

/**
 * 프롬프트 스니펫
 */
export interface Snippet {
  name: string;
  prompt: string;
}

/**
 * 스니펫 저장소 (snippets.json 구조)
 */
export interface SnippetStore {
  snippets: {
    [name: string]: string;
  };
}

/**
 * 작업 타입
 */
export enum JobType {
  RUN_SNIPPET = 'run_snippet',
  ASK_PROMPT = 'ask_prompt',
  DSL_COMMAND = 'dsl_command',
  CANCEL = 'cancel',
}

/**
 * 작업 상태
 */
export enum JobStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

/**
 * 작업 큐의 작업 항목
 */
export interface Job {
  id: string;
  channelId: string;
  type: JobType;
  prompt: string;
  status: JobStatus;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

/**
 * 세션 상태
 */
export interface SessionState {
  channelId: string;
  isWaitingForResponse: boolean;
  lastPrompt?: string;
  lastOutput?: string;
  timeoutAt?: string;
}

/**
 * 전체 상태 (state.json 구조)
 */
export interface State {
  sessions: {
    [channelId: string]: SessionState;
  };
  lastUpdated: string;
}

/**
 * tmux 세션 정보
 */
export interface TmuxSession {
  name: string;
  projectPath: string;
  isActive: boolean;
  lastChecked: string;
}

/**
 * tmux 명령 결과
 */
export interface TmuxCommandResult {
  success: boolean;
  output: string;
  error?: string;
}

/**
 * 출력 캡처 결과
 */
export interface CaptureResult {
  fullOutput: string;
  summary: string; // 긴 출력의 경우 처음 100줄 + 마지막 50줄
  isTruncated: boolean;
  totalLines: number;
}

/**
 * Slack 명령어 핸들러 타입
 */
export type SlackCommandHandler = (params: {
  channelId: string;
  userId: string;
  args: string[];
}) => Promise<string>;

/**
 * 로그 레벨
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

/**
 * 환경 변수 설정
 */
export interface EnvConfig {
  slackBotToken: string;
  slackAppToken: string;
  configDir: string;
  logLevel: LogLevel;
}
