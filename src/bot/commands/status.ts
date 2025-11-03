/**
 * /status 명령어 핸들러
 * /status command handler
 */

import { SlackCommandHandler } from '../../types';
import { ConfigStore } from '../../config/store';
import { getLogger } from '../../utils/logger';
import { getEnvConfig } from '../../utils/env';
import {
  formatBold,
  formatKeyValue,
  formatSectionHeader,
  formatTimestamp,
  formatInfo,
  formatWarning,
} from '../formatters';

/**
 * /status 명령어 핸들러
 * Handle /status command
 *
 * Usage: /status
 */
export const statusHandler: SlackCommandHandler = async ({
  channelId,
  userId,
  args,
}) => {
  const logger = getLogger();
  const envConfig = getEnvConfig();

  // args는 사용하지 않지만 타입 검사를 위해 포함
  void args;

  logger.info(`Status command from user ${userId} in channel ${channelId}`);

  try {
    // Config Store 초기화
    const configStore = new ConfigStore(envConfig.configDir);

    // 채널 설정 확인
    if (!configStore.hasChannel(channelId)) {
      return (
        formatWarning(formatBold('설정되지 않은 채널')) +
        '\n\n' +
        '이 채널은 아직 프로젝트에 연결되지 않았습니다.\n' +
        '먼저 `/setup <project-name> <project-path>` 명령어로 채널을 설정하세요.\n\n' +
        formatInfo('도움말: `/help` 명령어로 사용 가능한 명령어를 확인하세요.')
      );
    }

    // 채널 정보 가져오기
    const channelConfig = configStore.getChannel(channelId);

    if (!channelConfig) {
      return formatWarning('채널 정보를 가져올 수 없습니다.');
    }

    // 상태 메시지 생성
    let statusMessage = formatSectionHeader('📊 채널 상태') + '\n\n';

    // 프로젝트 정보
    statusMessage += formatKeyValue('프로젝트', channelConfig.projectName) + '\n';
    statusMessage +=
      formatKeyValue('경로', `\`${channelConfig.projectPath}\``) + '\n';
    statusMessage +=
      formatKeyValue('tmux 세션', `\`${channelConfig.tmuxSession}\``) + '\n';
    statusMessage +=
      formatKeyValue(
        '생성 시간',
        formatTimestamp(channelConfig.createdAt)
      ) + '\n';
    statusMessage +=
      formatKeyValue(
        '마지막 사용',
        formatTimestamp(channelConfig.lastUsed)
      ) + '\n';

    // TODO: 작업 큐 상태 추가 (Task 5.0에서 구현)
    statusMessage += '\n' + formatInfo('작업 큐 정보는 추후 추가될 예정입니다.');

    return statusMessage;
  } catch (error) {
    logger.error(`Status command failed: ${error}`);

    if (error instanceof Error) {
      return `❌ ${formatBold('상태 조회 실패')}\n\n${error.message}`;
    }

    return '❌ ' + formatBold('상태 조회 실패') + '\n\n알 수 없는 오류가 발생했습니다.';
  }
};
