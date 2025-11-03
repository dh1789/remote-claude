/**
 * 스니펫 이름 검증
 * Snippet name validator
 */

/**
 * 스니펫 이름 검증
 * Validate snippet name
 *
 * 규칙:
 * - kebab-case 형식 (소문자, 숫자, 하이픈만 허용)
 * - 1-50자
 * - 하이픈으로 시작하거나 끝날 수 없음
 * - 연속된 하이픈 불가
 *
 * @param name - Snippet name to validate
 * @throws Error if name is invalid
 */
export function validateSnippetName(name: string): void {
  // 빈 이름 체크
  if (!name || name.trim().length === 0) {
    throw new Error(
      '스니펫 이름이 비어있습니다.\n' +
      'Snippet name is empty.'
    );
  }

  // 길이 체크
  if (name.length > 50) {
    throw new Error(
      '스니펫 이름이 너무 깁니다. (최대 50자)\n' +
      'Snippet name is too long. (max 50 characters)'
    );
  }

  // kebab-case 패턴 검증
  const validPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  if (!validPattern.test(name)) {
    throw new Error(
      '스니펫 이름은 kebab-case 형식이어야 합니다.\n' +
      '(소문자, 숫자, 하이픈만 사용 가능, 하이픈으로 시작/끝날 수 없음)\n\n' +
      '예시: build-test, analyze-code, fix-bug-123\n\n' +
      'Snippet name must be in kebab-case format.\n' +
      '(lowercase letters, numbers, hyphens only, cannot start/end with hyphen)\n\n' +
      'Examples: build-test, analyze-code, fix-bug-123'
    );
  }
}

/**
 * 스니펫 프롬프트 검증
 * Validate snippet prompt
 *
 * @param prompt - Prompt text to validate
 * @throws Error if prompt is invalid
 */
export function validateSnippetPrompt(prompt: string): void {
  // 빈 프롬프트 체크
  if (!prompt || prompt.trim().length === 0) {
    throw new Error(
      '프롬프트가 비어있습니다.\n' +
      'Prompt is empty.'
    );
  }

  // 최대 길이 체크 (10,000자)
  if (prompt.length > 10000) {
    throw new Error(
      '프롬프트가 너무 깁니다. (최대 10,000자)\n' +
      'Prompt is too long. (max 10,000 characters)'
    );
  }
}
