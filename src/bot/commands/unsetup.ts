/**
 * /unsetup 명령어 핸들러
 * /unsetup command handler
 */

import { SlackCommandHandler } from '../../types';
import { ConfigStore } from '../../config/store';
import { getLogger } from '../../utils/logger';
import { getEnvConfig } from '../../utils/env';

/**
 * /unsetup 명령어 핸들러
 * Handle /unsetup command
 *
 * Usage: /unsetup
 */
export const unsetupHandler: SlackCommandHandler = async ({
  channelId,
  userId,
  args,
}) => {
  const logger = getLogger();
  const envConfig = getEnvConfig();

  // args는 사용하지 않지만 타입 검사를 위해 포함
  void args;

  logger.info(`Unsetup command from user ${userId} in channel ${channelId}`);

  try {
    // Config Store 초기화
    const configStore = new ConfigStore(envConfig.configDir);

    // 채널 설정 확인
    if (!configStore.hasChannel(channelId)) {
      return (
        '❌ *설정되지 않은 채널*\n\n' +
        '이 채널은 아직 프로젝트에 연결되지 않았습니다.\n' +
        '먼저 `/setup <project-name> <project-path>` 명령어로 채널을 설정하세요.'
      );
    }

    // 채널 정보 가져오기 (삭제 전 메시지에 표시하기 위해)
    const channelConfig = configStore.getChannel(channelId);

    // 채널 설정 삭제
    const deleted = configStore.deleteChannel(channelId);

    if (!deleted) {
      return '❌ *삭제 실패*\n\n알 수 없는 오류가 발생했습니다.';
    }

    // 성공 메시지
    return (
      '✅ *채널 설정 해제 완료*\n\n' +
      `*프로젝트:* ${channelConfig?.projectName}\n` +
      `*경로:* \`${channelConfig?.projectPath}\`\n\n` +
      '이 채널은 더 이상 프로젝트에 연결되어 있지 않습니다.\n' +
      '다시 설정하려면 `/setup` 명령어를 사용하세요.\n\n' +
      '*참고:* tmux 세션은 자동으로 종료되지 않습니다. ' +
      '수동으로 종료하려면 터미널에서 `tmux kill-session -t ' +
      `${channelConfig?.tmuxSession}\` 명령어를 실행하세요.`
    );
  } catch (error) {
    logger.error(`Unsetup failed: ${error}`);

    if (error instanceof Error) {
      return `❌ *설정 해제 실패*\n\n${error.message}`;
    }

    return '❌ *설정 해제 실패*\n\n알 수 없는 오류가 발생했습니다.';
  }
};
