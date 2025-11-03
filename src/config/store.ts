/**
 * Config Store 클래스
 * Configuration store for channel-project mappings
 */

import * as fs from 'fs';
import * as path from 'path';
import { Config, ChannelConfig } from '../types';
import { getLogger } from '../utils/logger';
import { toAbsolutePath } from '../utils/path';

/**
 * Config Store 클래스
 * Manages configuration file (config.json) with channel-project mappings
 */
export class ConfigStore {
  private configFilePath: string;
  private config: Config;

  /**
   * ConfigStore 생성자
   * @param configDir - Configuration directory path
   */
  constructor(configDir: string) {
    this.configFilePath = path.join(configDir, 'config.json');
    this.config = this.loadConfig();
  }

  /**
   * 설정 파일 로드
   * Load configuration from file
   */
  private loadConfig(): Config {
    const logger = getLogger();

    if (!fs.existsSync(this.configFilePath)) {
      logger.warn(`Config file not found: ${this.configFilePath}`);
      return { channels: {} };
    }

    try {
      const data = fs.readFileSync(this.configFilePath, 'utf-8');
      const config = JSON.parse(data) as Config;
      logger.debug(`Config loaded from ${this.configFilePath}`);
      return config;
    } catch (error) {
      logger.error(`Failed to load config file: ${error}`);
      return { channels: {} };
    }
  }

  /**
   * 설정 파일 저장
   * Save configuration to file
   */
  private saveConfig(): void {
    const logger = getLogger();

    try {
      const data = JSON.stringify(this.config, null, 2);
      fs.writeFileSync(this.configFilePath, data, 'utf-8');
      logger.debug(`Config saved to ${this.configFilePath}`);
    } catch (error) {
      logger.error(`Failed to save config file: ${error}`);
      throw error;
    }
  }

  /**
   * 채널 설정 추가 또는 업데이트
   * Add or update channel configuration
   *
   * @param channelId - Slack channel ID
   * @param projectName - Project name
   * @param projectPath - Project path
   * @param tmuxSession - tmux session name
   */
  public setChannel(
    channelId: string,
    projectName: string,
    projectPath: string,
    tmuxSession: string
  ): void {
    const logger = getLogger();
    const now = new Date().toISOString();

    const existingConfig = this.config.channels[channelId];
    const isUpdate = existingConfig !== undefined;

    this.config.channels[channelId] = {
      channelId,
      projectPath: toAbsolutePath(projectPath),
      projectName,
      tmuxSession,
      createdAt: isUpdate ? existingConfig.createdAt : now,
      lastUsed: now,
    };

    this.saveConfig();

    if (isUpdate) {
      logger.info(`Channel updated: ${channelId} -> ${projectName}`);
    } else {
      logger.info(`Channel added: ${channelId} -> ${projectName}`);
    }
  }

  /**
   * 채널 설정 가져오기
   * Get channel configuration
   *
   * @param channelId - Slack channel ID
   * @returns Channel configuration or undefined if not found
   */
  public getChannel(channelId: string): ChannelConfig | undefined {
    return this.config.channels[channelId];
  }

  /**
   * 채널이 설정되어 있는지 확인
   * Check if channel is configured
   */
  public hasChannel(channelId: string): boolean {
    return this.config.channels[channelId] !== undefined;
  }

  /**
   * 채널 설정 삭제
   * Delete channel configuration
   *
   * @param channelId - Slack channel ID
   * @returns true if deleted, false if channel not found
   */
  public deleteChannel(channelId: string): boolean {
    const logger = getLogger();

    if (!this.hasChannel(channelId)) {
      logger.warn(`Channel not found: ${channelId}`);
      return false;
    }

    delete this.config.channels[channelId];
    this.saveConfig();

    logger.info(`Channel deleted: ${channelId}`);
    return true;
  }

  /**
   * 모든 채널 설정 가져오기
   * Get all channel configurations
   */
  public getAllChannels(): ChannelConfig[] {
    return Object.values(this.config.channels);
  }

  /**
   * 프로젝트 경로로 채널 찾기
   * Find channel by project path
   *
   * @param projectPath - Project path
   * @returns Channel configuration or undefined if not found
   */
  public findChannelByPath(projectPath: string): ChannelConfig | undefined {
    const absPath = toAbsolutePath(projectPath);
    return this.getAllChannels().find(
      (channel) => channel.projectPath === absPath
    );
  }

  /**
   * 모든 프로젝트 경로 가져오기
   * Get all project paths
   */
  public getAllProjectPaths(): string[] {
    return this.getAllChannels().map((channel) => channel.projectPath);
  }

  /**
   * 채널의 마지막 사용 시간 업데이트
   * Update last used time for channel
   */
  public updateLastUsed(channelId: string): void {
    const logger = getLogger();

    if (!this.hasChannel(channelId)) {
      logger.warn(`Channel not found: ${channelId}`);
      return;
    }

    this.config.channels[channelId].lastUsed = new Date().toISOString();
    this.saveConfig();
  }

  /**
   * 설정 새로고침 (파일에서 다시 로드)
   * Refresh configuration from file
   */
  public refresh(): void {
    this.config = this.loadConfig();
  }
}
