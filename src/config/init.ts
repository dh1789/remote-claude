/**
 * 설정 디렉토리 초기화
 * Configuration directory initialization
 */

import * as fs from 'fs';
import * as path from 'path';
import { Config, SnippetStore, State } from '../types';

/**
 * 디렉토리가 존재하는지 확인하고 생성
 * Check if directory exists and create it if not
 */
function ensureDirectory(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * 파일이 존재하는지 확인
 * Check if file exists
 */
function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

/**
 * JSON 파일 초기화 (파일이 없을 때만 생성)
 * Initialize JSON file (only if it doesn't exist)
 */
function initJsonFile(filePath: string, initialData: unknown): void {
  if (!fileExists(filePath)) {
    fs.writeFileSync(
      filePath,
      JSON.stringify(initialData, null, 2),
      'utf-8'
    );
  }
}

/**
 * 설정 디렉토리 초기화
 * Initialize configuration directory and all required files
 *
 * @param configDir - Configuration directory path (e.g., ~/.remote-claude)
 * @returns Object containing paths to all created files
 */
export function initConfigDirectory(configDir: string): {
  configDir: string;
  configFile: string;
  snippetsFile: string;
  stateFile: string;
  logsDir: string;
} {
  // 1. 메인 설정 디렉토리 생성
  ensureDirectory(configDir);

  // 2. 로그 디렉토리 생성
  const logsDir = path.join(configDir, 'logs');
  ensureDirectory(logsDir);

  // 3. config.json 초기화
  const configFile = path.join(configDir, 'config.json');
  const initialConfig: Config = {
    channels: {},
  };
  initJsonFile(configFile, initialConfig);

  // 4. snippets.json 초기화
  const snippetsFile = path.join(configDir, 'snippets.json');
  const initialSnippets: SnippetStore = {
    snippets: {},
  };
  initJsonFile(snippetsFile, initialSnippets);

  // 5. state.json 초기화
  const stateFile = path.join(configDir, 'state.json');
  const initialState: State = {
    sessions: {},
    lastUpdated: new Date().toISOString(),
  };
  initJsonFile(stateFile, initialState);

  return {
    configDir,
    configFile,
    snippetsFile,
    stateFile,
    logsDir,
  };
}

/**
 * 설정 디렉토리 검증
 * Validate configuration directory
 *
 * @param configDir - Configuration directory path
 * @throws Error if configuration directory or required files are missing
 */
export function validateConfigDirectory(configDir: string): void {
  if (!fs.existsSync(configDir)) {
    throw new Error(
      `Configuration directory does not exist: ${configDir}. ` +
      'Run initConfigDirectory() first.'
    );
  }

  const configFile = path.join(configDir, 'config.json');
  if (!fileExists(configFile)) {
    throw new Error(
      `config.json not found in ${configDir}. ` +
      'Run initConfigDirectory() first.'
    );
  }

  const snippetsFile = path.join(configDir, 'snippets.json');
  if (!fileExists(snippetsFile)) {
    throw new Error(
      `snippets.json not found in ${configDir}. ` +
      'Run initConfigDirectory() first.'
    );
  }

  const stateFile = path.join(configDir, 'state.json');
  if (!fileExists(stateFile)) {
    throw new Error(
      `state.json not found in ${configDir}. ` +
      'Run initConfigDirectory() first.'
    );
  }
}

/**
 * 설정 디렉토리 리셋 (모든 파일 삭제 후 재초기화)
 * Reset configuration directory (delete all files and reinitialize)
 *
 * WARNING: This will delete all existing configuration, snippets, and state!
 *
 * @param configDir - Configuration directory path
 */
export function resetConfigDirectory(configDir: string): void {
  if (fs.existsSync(configDir)) {
    // 재귀적으로 디렉토리 삭제
    fs.rmSync(configDir, { recursive: true, force: true });
  }

  // 디렉토리 재생성 및 초기화
  initConfigDirectory(configDir);
}

/**
 * 설정 파일 경로 가져오기
 * Get configuration file paths
 */
export function getConfigPaths(configDir: string): {
  configFile: string;
  snippetsFile: string;
  stateFile: string;
  logsDir: string;
} {
  return {
    configFile: path.join(configDir, 'config.json'),
    snippetsFile: path.join(configDir, 'snippets.json'),
    stateFile: path.join(configDir, 'state.json'),
    logsDir: path.join(configDir, 'logs'),
  };
}
