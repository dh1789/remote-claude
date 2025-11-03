/**
 * /ask 명령어 핸들러
 * /ask command handler - Execute direct prompt
 */

import { SlackCommandHandler } from '../../types';
import { ConfigStore } from '../../config/store';
import { TmuxManager } from '../../tmux/manager';
import { getLogger } from '../../utils/logger';
import { getEnvConfig } from '../../utils/env';
import {
  formatBold,
  formatWarning,
  formatError,
  formatInProgress,
  formatCodeBlock,
} from '../formatters';

/**
 * /ask 명령어 핸들러
 * Handle /ask command - Execute direct prompt
 *
 * Usage: /ask <prompt>
 *
 * NOTE: 현재는 기본 구현입니다. Task 5.0에서 작업 큐 시스템과 통합될 예정입니다.
 */
export const askHandler: SlackCommandHandler = async ({
  channelId,
  userId,
  args,
}) => {
  const logger = getLogger();
  logger.info(`Ask command from user ${userId} in channel ${channelId}`);

  // 인자 검증
  if (args.length === 0) {
    return (
      formatWarning(formatBold('사용법 오류')) +
      '\n\n' +
      '사용법: `/ask <prompt>`\n\n' +
      formatBold('예시:') +
      '\n' +
      '`/ask "Build the project and run all tests."`\n' +
      '`/ask "Analyze the performance bottlenecks in src/server.ts"`\n' +
      '`/ask "Fix the bug in authentication flow"`'
    );
  }

  const prompt = args.join(' ');

  // 프롬프트 길이 체크
  if (prompt.length > 10000) {
    return (
      formatWarning(formatBold('프롬프트가 너무 김')) +
      '\n\n' +
      `프롬프트 길이: ${prompt.length}자 (최대 10,000자)\n` +
      '프롬프트를 짧게 줄이거나 스니펫으로 등록하세요.'
    );
  }

  try {
    const envConfig = getEnvConfig();

    // 1. 채널 설정 확인
    const configStore = new ConfigStore(envConfig.configDir);
    if (!configStore.hasChannel(channelId)) {
      return (
        formatWarning(formatBold('설정되지 않은 채널')) +
        '\n\n' +
        '이 채널은 아직 프로젝트에 연결되지 않았습니다.\n' +
        '먼저 `/setup <project-name> <project-path>` 명령어로 채널을 설정하세요.'
      );
    }

    const channelConfig = configStore.getChannel(channelId);
    if (!channelConfig) {
      return formatError('채널 설정을 가져올 수 없습니다.');
    }

    // 2. 작업 시작 메시지
    // TODO (Task 5.0): 작업 큐에 추가하고 백그라운드에서 실행
    const message =
      formatInProgress(formatBold('작업 시작')) +
      '\n\n' +
      `${formatBold('프로젝트')}: ${channelConfig.projectName}\n` +
      `${formatBold('경로')}: \`${channelConfig.projectPath}\`\n` +
      `${formatBold('프롬프트')}:\n` +
      formatCodeBlock(prompt.slice(0, 200) + (prompt.length > 200 ? '...' : '')) +
      '\n' +
      '📝 ' +
      formatBold('NOTE:') +
      ' 현재는 기본 구현입니다.\n' +
      'Task 5.0에서 작업 큐 시스템과 통합되어 백그라운드 실행, 폴링, 대화형 응답 처리가 추가될 예정입니다.\n\n' +
      '임시로 tmux 세션에 프롬프트를 전송합니다...';

    // 3. 임시 구현: tmux에 직접 전송
    const tmuxManager = new TmuxManager();
    const result = await tmuxManager.startClaudeCode(
      channelConfig.tmuxSession,
      channelConfig.projectPath
    );

    if (!result.success) {
      return (
        formatError(formatBold('Claude Code 시작 실패')) +
        '\n\n' +
        (result.error || '알 수 없는 오류')
      );
    }

    await tmuxManager.sendPrompt(channelConfig.tmuxSession, prompt);

    return (
      message +
      '\n\n' +
      '✅ 프롬프트가 전송되었습니다.\n' +
      `tmux 세션 \`${channelConfig.tmuxSession}\`에서 실행 중입니다.`
    );
  } catch (error) {
    logger.error(`Ask command failed: ${error}`);

    if (error instanceof Error) {
      return formatError(formatBold('실행 실패')) + '\n\n' + error.message;
    }

    return formatError(formatBold('실행 실패')) + '\n\n알 수 없는 오류가 발생했습니다.';
  }
};
