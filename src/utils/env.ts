/**
 * 환경 변수 로더 및 검증
 * Environment variable loader and validator
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as os from 'os';
import { EnvConfig, LogLevel } from '../types';

/**
 * .env 파일 로드
 * Load .env file
 */
export function loadEnv(): void {
  dotenv.config();
}

/**
 * 경로에서 ~ 를 홈 디렉토리로 확장
 * Expand ~ to home directory in path
 */
function expandHomePath(filePath: string): string {
  if (filePath.startsWith('~/') || filePath === '~') {
    return path.join(os.homedir(), filePath.slice(1));
  }
  return filePath;
}

/**
 * 로그 레벨 검증
 * Validate log level
 */
function validateLogLevel(level: string): LogLevel {
  const validLevels: LogLevel[] = [
    LogLevel.DEBUG,
    LogLevel.INFO,
    LogLevel.WARN,
    LogLevel.ERROR,
  ];

  const lowerLevel = level.toLowerCase();
  if (!validLevels.includes(lowerLevel as LogLevel)) {
    throw new Error(
      `Invalid LOG_LEVEL: ${level}. Must be one of: ${validLevels.join(', ')}`
    );
  }

  return lowerLevel as LogLevel;
}

/**
 * 환경 변수 검증 및 로드
 * Validate and load environment variables
 *
 * @throws Error if required environment variables are missing or invalid
 * @returns EnvConfig object with validated configuration
 */
export function getEnvConfig(): EnvConfig {
  // 필수 환경 변수 검증
  // Validate required environment variables
  const slackBotToken = process.env.SLACK_BOT_TOKEN;
  if (!slackBotToken) {
    throw new Error(
      'SLACK_BOT_TOKEN is required. Please set it in .env file or environment variables.'
    );
  }

  if (!slackBotToken.startsWith('xoxb-')) {
    throw new Error(
      'SLACK_BOT_TOKEN must start with "xoxb-". Please check your Bot User OAuth Token.'
    );
  }

  const slackAppToken = process.env.SLACK_APP_TOKEN;
  if (!slackAppToken) {
    throw new Error(
      'SLACK_APP_TOKEN is required. Please set it in .env file or environment variables.'
    );
  }

  if (!slackAppToken.startsWith('xapp-')) {
    throw new Error(
      'SLACK_APP_TOKEN must start with "xapp-". Please check your App-Level Token.'
    );
  }

  // 선택적 환경 변수 (기본값 제공)
  // Optional environment variables with defaults
  const configDir = expandHomePath(
    process.env.CONFIG_DIR || '~/.remote-claude'
  );

  const logLevel = validateLogLevel(process.env.LOG_LEVEL || 'info');

  return {
    slackBotToken,
    slackAppToken,
    configDir,
    logLevel,
  };
}

/**
 * 환경 변수 설정 요약 출력 (보안 정보 마스킹)
 * Print environment configuration summary (with sensitive data masked)
 */
export function printEnvSummary(config: EnvConfig): void {
  console.log('Environment Configuration:');
  console.log(`  Slack Bot Token: ${maskToken(config.slackBotToken)}`);
  console.log(`  Slack App Token: ${maskToken(config.slackAppToken)}`);
  console.log(`  Config Directory: ${config.configDir}`);
  console.log(`  Log Level: ${config.logLevel}`);
}

/**
 * 토큰 마스킹 (보안)
 * Mask token for security
 */
function maskToken(token: string): string {
  if (token.length <= 8) {
    return '***';
  }
  const prefix = token.slice(0, 8);
  return `${prefix}...`;
}
