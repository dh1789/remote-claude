/**
 * 로깅 유틸리티
 * Logging utility using Winston
 */

import * as winston from 'winston';
import * as path from 'path';
import * as fs from 'fs';
import { LogLevel } from '../types';

/**
 * 로그 디렉토리 생성
 * Create logs directory if it doesn't exist
 */
function ensureLogDirectory(logDir: string): void {
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
}

/**
 * Winston 로거 인스턴스
 * Winston logger instance
 */
let logger: winston.Logger | null = null;

/**
 * 로거 초기화
 * Initialize logger with specified log level
 *
 * @param logLevel - Log level (debug, info, warn, error)
 * @param logDir - Directory to store log files (default: ./logs)
 */
export function initLogger(
  logLevel: LogLevel = LogLevel.INFO,
  logDir: string = './logs'
): winston.Logger {
  // 로그 디렉토리 생성
  ensureLogDirectory(logDir);

  // Winston 포맷 설정
  const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.printf(({ timestamp, level, message, stack }) => {
      if (stack) {
        return `${timestamp} [${level.toUpperCase()}]: ${message}\n${stack}`;
      }
      return `${timestamp} [${level.toUpperCase()}]: ${message}`;
    })
  );

  // Console 포맷 (색상 추가)
  const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level}]: ${message}`;
    })
  );

  // Transport 설정
  const transports: winston.transport[] = [
    // Console output
    new winston.transports.Console({
      format: consoleFormat,
      level: logLevel,
    }),

    // Combined log file (모든 로그)
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      format: logFormat,
      level: logLevel,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    }),

    // Error log file (에러만)
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      format: logFormat,
      level: 'error',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    }),
  ];

  // Logger 생성
  logger = winston.createLogger({
    level: logLevel,
    transports,
    exitOnError: false,
  });

  return logger;
}

/**
 * 로거 인스턴스 가져오기
 * Get logger instance (must call initLogger first)
 */
export function getLogger(): winston.Logger {
  if (!logger) {
    throw new Error(
      'Logger not initialized. Call initLogger() first.'
    );
  }
  return logger;
}

/**
 * 편의 함수: Debug 로그
 * Convenience function: Debug log
 */
export function debug(message: string, ...args: unknown[]): void {
  getLogger().debug(message, ...args);
}

/**
 * 편의 함수: Info 로그
 * Convenience function: Info log
 */
export function info(message: string, ...args: unknown[]): void {
  getLogger().info(message, ...args);
}

/**
 * 편의 함수: Warning 로그
 * Convenience function: Warning log
 */
export function warn(message: string, ...args: unknown[]): void {
  getLogger().warn(message, ...args);
}

/**
 * 편의 함수: Error 로그
 * Convenience function: Error log
 */
export function error(message: string, ...args: unknown[]): void {
  getLogger().error(message, ...args);
}

/**
 * 로그 레벨 변경
 * Change log level dynamically
 */
export function setLogLevel(level: LogLevel): void {
  const currentLogger = getLogger();
  currentLogger.level = level;
  currentLogger.transports.forEach((transport) => {
    if (transport instanceof winston.transports.Console) {
      transport.level = level;
    } else if (transport instanceof winston.transports.File) {
      // error.log는 항상 error 레벨 유지
      if (transport.filename && transport.filename.includes('error.log')) {
        return;
      }
      transport.level = level;
    }
  });
  info(`Log level changed to: ${level}`);
}

/**
 * Clear logger instance (for testing)
 * Clear the singleton logger instance
 */
export function clearLoggerInstance(): void {
  logger = null;
}
