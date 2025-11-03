/**
 * /snippet 명령어 핸들러
 * /snippet command handlers
 */

import { SlackCommandHandler } from '../../types';
import { SnippetStoreManager } from '../../snippet/store';
import { validateSnippetName, validateSnippetPrompt } from '../../snippet/validator';
import { getLogger } from '../../utils/logger';
import { getEnvConfig } from '../../utils/env';
import {
  formatBold,
  formatList,
  formatCodeBlock,
  formatSectionHeader,
  formatInfo,
  formatWarning,
  formatSuccess,
  formatError,
} from '../formatters';

/**
 * /snippet 명령어 핸들러
 * Handle /snippet command with subcommands
 *
 * Usage:
 * - /snippet list
 * - /snippet add <name> <prompt>
 * - /snippet edit <name> <new-prompt>
 * - /snippet delete <name>
 * - /snippet show <name>
 */
export const snippetHandler: SlackCommandHandler = async ({
  channelId,
  userId,
  args,
}) => {
  const logger = getLogger();
  logger.info(`Snippet command from user ${userId} in channel ${channelId}`);

  // 서브커맨드 확인
  if (args.length === 0) {
    return (
      formatWarning(formatBold('사용법 오류')) +
      '\n\n' +
      '사용법: `/snippet <subcommand> [arguments]`\n\n' +
      formatBold('사용 가능한 서브커맨드:') +
      '\n' +
      formatList([
        '`list` - 등록된 스니펫 목록 보기',
        '`add <name> <prompt>` - 새 스니펫 추가',
        '`edit <name> <new-prompt>` - 스니펫 수정',
        '`delete <name>` - 스니펫 삭제',
        '`show <name>` - 스니펫 내용 보기',
      ]) +
      '\n\n' +
      formatInfo('예시: `/snippet add build-test "Build the project and run all tests."`')
    );
  }

  const subcommand = args[0].toLowerCase();
  const subArgs = args.slice(1);

  switch (subcommand) {
    case 'list':
      return handleList(subArgs);
    case 'add':
      return handleAdd(subArgs);
    case 'edit':
      return handleEdit(subArgs);
    case 'delete':
      return handleDelete(subArgs);
    case 'show':
      return handleShow(subArgs);
    default:
      return (
        formatError(formatBold('알 수 없는 서브커맨드')) +
        `\n\n알 수 없는 서브커맨드: \`${subcommand}\`\n\n` +
        formatInfo('사용 가능한 서브커맨드: list, add, edit, delete, show')
      );
  }
};

/**
 * /snippet list - 스니펫 목록 보기
 */
function handleList(args: string[]): string {
  // args는 사용하지 않지만 타입 검사를 위해 포함
  void args;

  const envConfig = getEnvConfig();
  const snippetStore = new SnippetStoreManager(envConfig.configDir);

  const snippets = snippetStore.getAllSnippets();

  if (snippets.length === 0) {
    return (
      formatInfo(formatBold('등록된 스니펫 없음')) +
      '\n\n' +
      '아직 등록된 스니펫이 없습니다.\n' +
      '`/snippet add <name> <prompt>` 명령어로 스니펫을 추가하세요.\n\n' +
      formatBold('예시:') +
      '\n' +
      '`/snippet add build-test "Build the project and run all tests."`'
    );
  }

  let message = formatSectionHeader(`📋 스니펫 목록 (${snippets.length}개)`) + '\n\n';

  for (const snippet of snippets) {
    const preview = snippet.prompt.slice(0, 60);
    const ellipsis = snippet.prompt.length > 60 ? '...' : '';
    message += `• ${formatBold(snippet.name)}: ${preview}${ellipsis}\n`;
  }

  message +=
    '\n' +
    formatInfo(
      '스니펫 전체 내용 보기: `/snippet show <name>`\n' +
      '스니펫 실행: `/run <name>`'
    );

  return message;
}

/**
 * /snippet add - 스니펫 추가
 */
function handleAdd(args: string[]): string {
  if (args.length < 2) {
    return (
      formatWarning(formatBold('사용법 오류')) +
      '\n\n' +
      '사용법: `/snippet add <name> <prompt>`\n\n' +
      formatBold('예시:') +
      '\n' +
      '`/snippet add build-test "Build the project and run all tests."`\n' +
      '`/snippet add fix-bug "Fix the bug in src/server.ts line 45."`\n\n' +
      formatBold('스니펫 이름 규칙:') +
      '\n' +
      '• kebab-case 형식 (예: build-test, analyze-code)\n' +
      '• 소문자, 숫자, 하이픈(-) 만 사용\n' +
      '• 1-50자'
    );
  }

  const name = args[0];
  const prompt = args.slice(1).join(' ');

  try {
    // 검증
    validateSnippetName(name);
    validateSnippetPrompt(prompt);

    // 저장
    const envConfig = getEnvConfig();
    const snippetStore = new SnippetStoreManager(envConfig.configDir);

    const isUpdate = snippetStore.hasSnippet(name);
    snippetStore.setSnippet(name, prompt);

    const action = isUpdate ? '업데이트' : '추가';

    return (
      formatSuccess(formatBold(`스니펫 ${action} 완료`)) +
      '\n\n' +
      `${formatBold('이름')}: ${name}\n` +
      `${formatBold('프롬프트')}:\n` +
      formatCodeBlock(prompt) +
      '\n\n' +
      formatInfo(`스니펫 실행: \`/run ${name}\``)
    );
  } catch (error) {
    if (error instanceof Error) {
      return formatError(formatBold('스니펫 추가 실패')) + '\n\n' + error.message;
    }
    return formatError(formatBold('스니펫 추가 실패')) + '\n\n알 수 없는 오류가 발생했습니다.';
  }
}

/**
 * /snippet edit - 스니펫 수정
 */
function handleEdit(args: string[]): string {
  if (args.length < 2) {
    return (
      formatWarning(formatBold('사용법 오류')) +
      '\n\n' +
      '사용법: `/snippet edit <name> <new-prompt>`\n\n' +
      formatBold('예시:') +
      '\n' +
      '`/snippet edit build-test "Build the project and run all unit tests with coverage."`'
    );
  }

  const name = args[0];
  const newPrompt = args.slice(1).join(' ');

  try {
    // 검증
    validateSnippetName(name);
    validateSnippetPrompt(newPrompt);

    // 업데이트
    const envConfig = getEnvConfig();
    const snippetStore = new SnippetStoreManager(envConfig.configDir);

    if (!snippetStore.hasSnippet(name)) {
      return (
        formatWarning(formatBold('스니펫을 찾을 수 없음')) +
        '\n\n' +
        `스니펫 \`${name}\`을(를) 찾을 수 없습니다.\n` +
        '`/snippet list` 명령어로 등록된 스니펫 목록을 확인하세요.'
      );
    }

    snippetStore.setSnippet(name, newPrompt);

    return (
      formatSuccess(formatBold('스니펫 수정 완료')) +
      '\n\n' +
      `${formatBold('이름')}: ${name}\n` +
      `${formatBold('새 프롬프트')}:\n` +
      formatCodeBlock(newPrompt)
    );
  } catch (error) {
    if (error instanceof Error) {
      return formatError(formatBold('스니펫 수정 실패')) + '\n\n' + error.message;
    }
    return formatError(formatBold('스니펫 수정 실패')) + '\n\n알 수 없는 오류가 발생했습니다.';
  }
}

/**
 * /snippet delete - 스니펫 삭제
 */
function handleDelete(args: string[]): string {
  if (args.length < 1) {
    return (
      formatWarning(formatBold('사용법 오류')) +
      '\n\n' +
      '사용법: `/snippet delete <name>`\n\n' +
      formatBold('예시:') +
      '\n' +
      '`/snippet delete build-test`'
    );
  }

  const name = args[0];

  try {
    // 검증
    validateSnippetName(name);

    // 삭제
    const envConfig = getEnvConfig();
    const snippetStore = new SnippetStoreManager(envConfig.configDir);

    if (!snippetStore.hasSnippet(name)) {
      return (
        formatWarning(formatBold('스니펫을 찾을 수 없음')) +
        '\n\n' +
        `스니펫 \`${name}\`을(를) 찾을 수 없습니다.\n` +
        '`/snippet list` 명령어로 등록된 스니펫 목록을 확인하세요.'
      );
    }

    snippetStore.deleteSnippet(name);

    return (
      formatSuccess(formatBold('스니펫 삭제 완료')) +
      '\n\n' +
      `스니펫 \`${name}\`이(가) 삭제되었습니다.`
    );
  } catch (error) {
    if (error instanceof Error) {
      return formatError(formatBold('스니펫 삭제 실패')) + '\n\n' + error.message;
    }
    return formatError(formatBold('스니펫 삭제 실패')) + '\n\n알 수 없는 오류가 발생했습니다.';
  }
}

/**
 * /snippet show - 스니펫 내용 보기
 */
function handleShow(args: string[]): string {
  if (args.length < 1) {
    return (
      formatWarning(formatBold('사용법 오류')) +
      '\n\n' +
      '사용법: `/snippet show <name>`\n\n' +
      formatBold('예시:') +
      '\n' +
      '`/snippet show build-test`'
    );
  }

  const name = args[0];

  try {
    // 검증
    validateSnippetName(name);

    // 조회
    const envConfig = getEnvConfig();
    const snippetStore = new SnippetStoreManager(envConfig.configDir);

    const prompt = snippetStore.getSnippet(name);

    if (!prompt) {
      return (
        formatWarning(formatBold('스니펫을 찾을 수 없음')) +
        '\n\n' +
        `스니펫 \`${name}\`을(를) 찾을 수 없습니다.\n` +
        '`/snippet list` 명령어로 등록된 스니펫 목록을 확인하세요.'
      );
    }

    return (
      formatSectionHeader(`📄 스니펫: ${name}`) +
      '\n\n' +
      formatCodeBlock(prompt) +
      '\n\n' +
      formatInfo(
        `스니펫 실행: \`/run ${name}\`\n` +
        `스니펫 수정: \`/snippet edit ${name} <new-prompt>\`\n` +
        `스니펫 삭제: \`/snippet delete ${name}\``
      )
    );
  } catch (error) {
    if (error instanceof Error) {
      return formatError(formatBold('스니펫 조회 실패')) + '\n\n' + error.message;
    }
    return formatError(formatBold('스니펫 조회 실패')) + '\n\n알 수 없는 오류가 발생했습니다.';
  }
}
