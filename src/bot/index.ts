/**
 * Slack Bot 초기화 및 메인 엔트리포인트
 * Slack Bot initialization and main entry point
 */

import { App, LogLevel as BoltLogLevel } from '@slack/bolt';
import { getEnvConfig } from '../utils/env';
import { getLogger } from '../utils/logger';
import { LogLevel } from '../types';

/**
 * Bolt LogLevel을 우리의 LogLevel로 매핑
 * Map Bolt LogLevel to our LogLevel
 */
function mapLogLevel(logLevel: LogLevel): BoltLogLevel {
  const mapping: Record<LogLevel, BoltLogLevel> = {
    [LogLevel.DEBUG]: BoltLogLevel.DEBUG,
    [LogLevel.INFO]: BoltLogLevel.INFO,
    [LogLevel.WARN]: BoltLogLevel.WARN,
    [LogLevel.ERROR]: BoltLogLevel.ERROR,
  };
  return mapping[logLevel];
}

/**
 * Slack Bot App 인스턴스
 * Slack Bot App instance
 */
let app: App | null = null;

/**
 * Slack Bot 초기화
 * Initialize Slack Bot with Socket Mode
 *
 * @returns Initialized Slack App instance
 */
export function initBot(): App {
  const logger = getLogger();
  const envConfig = getEnvConfig();

  logger.info('Initializing Slack Bot...');

  // Socket Mode로 Bolt App 초기화
  app = new App({
    token: envConfig.slackBotToken,
    appToken: envConfig.slackAppToken,
    socketMode: true,
    logLevel: mapLogLevel(envConfig.logLevel),
  });

  // 에러 핸들러 등록
  app.error(async (error) => {
    logger.error('Slack Bot error occurred:', error);
  });

  logger.info('Slack Bot initialized successfully');

  return app;
}

/**
 * Slack Bot 인스턴스 가져오기
 * Get Slack Bot instance (must call initBot first)
 */
export function getBot(): App {
  if (!app) {
    throw new Error(
      'Bot not initialized. Call initBot() first.'
    );
  }
  return app;
}

/**
 * Slack Bot 시작
 * Start Slack Bot
 */
export async function startBot(): Promise<void> {
  const logger = getLogger();
  const bot = getBot();

  try {
    logger.info('Starting Slack Bot...');
    await bot.start();
    logger.info('⚡️ Slack Bot is running!');
  } catch (error) {
    logger.error('Failed to start Slack Bot:', error);
    throw error;
  }
}

/**
 * Slack Bot 중지
 * Stop Slack Bot
 */
export async function stopBot(): Promise<void> {
  const logger = getLogger();
  const bot = getBot();

  try {
    logger.info('Stopping Slack Bot...');
    await bot.stop();
    logger.info('Slack Bot stopped');
  } catch (error) {
    logger.error('Failed to stop Slack Bot:', error);
    throw error;
  }
}
