/**
 * /setup 명령어 핸들러
 * /setup command handler
 */

import { SlackCommandHandler } from '../../types';
import { ConfigStore } from '../../config/store';
import {
  validateProjectName,
  validateProjectPath,
  validatePathConflicts,
  toAbsolutePath,
} from '../../utils/path';
import { getLogger } from '../../utils/logger';
import { getEnvConfig } from '../../utils/env';

/**
 * tmux 세션 이름 생성
 * Generate tmux session name from channel ID
 */
function generateTmuxSessionName(channelId: string): string {
  return `claude-${channelId}`;
}

/**
 * /setup 명령어 핸들러
 * Handle /setup command
 *
 * Usage: /setup <project-name> <project-path>
 */
export const setupHandler: SlackCommandHandler = async ({
  channelId,
  userId,
  args,
}) => {
  const logger = getLogger();
  const envConfig = getEnvConfig();

  logger.info(`Setup command from user ${userId} in channel ${channelId}`);

  // 인자 검증
  if (args.length < 2) {
    return (
      '*사용법 오류*\n\n' +
      '사용법: `/setup <project-name> <project-path>`\n\n' +
      '*예시:*\n' +
      '• `/setup my-app /Users/username/projects/my-app`\n' +
      '• `/setup frontend ~/workspace/project/frontend`\n\n' +
      '*설명:*\n' +
      '• `<project-name>`: 프로젝트 이름 (알파벳, 숫자, -, _ 만 사용)\n' +
      '• `<project-path>`: 프로젝트 디렉토리 절대 경로'
    );
  }

  const projectName = args[0];
  const projectPath = args.slice(1).join(' '); // 경로에 공백이 있을 수 있음

  try {
    // 1. 프로젝트 이름 검증
    validateProjectName(projectName);

    // 2. 프로젝트 경로 검증
    validateProjectPath(projectPath);

    // 3. Config Store 초기화
    const configStore = new ConfigStore(envConfig.configDir);

    // 4. 경로 충돌 검증 (현재 채널의 경로는 제외)
    const existingChannel = configStore.getChannel(channelId);
    const allPaths = configStore.getAllProjectPaths();
    const otherPaths = existingChannel
      ? allPaths.filter((p) => p !== existingChannel.projectPath)
      : allPaths;
    validatePathConflicts(projectPath, otherPaths);

    // 5. tmux 세션 이름 생성
    const tmuxSession = generateTmuxSessionName(channelId);

    // 6. 채널 설정 저장
    const absolutePath = toAbsolutePath(projectPath);
    configStore.setChannel(channelId, projectName, absolutePath, tmuxSession);

    // 7. 성공 메시지 반환
    const isUpdate = existingChannel !== undefined;
    const action = isUpdate ? '업데이트' : '설정';

    return (
      `✅ *채널 ${action} 완료*\n\n` +
      `*프로젝트:* ${projectName}\n` +
      `*경로:* \`${absolutePath}\`\n` +
      `*tmux 세션:* \`${tmuxSession}\`\n\n` +
      `이제 \`/run\` 또는 \`/ask\` 명령어로 Claude Code에 작업을 요청할 수 있습니다.\n` +
      `자주 사용하는 프롬프트는 \`/snippet add\` 로 등록하세요.`
    );
  } catch (error) {
    logger.error(`Setup failed: ${error}`);

    if (error instanceof Error) {
      return `❌ *설정 실패*\n\n${error.message}`;
    }

    return '❌ *설정 실패*\n\n알 수 없는 오류가 발생했습니다.';
  }
};
