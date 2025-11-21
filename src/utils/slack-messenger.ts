/**
 * Unified Slack Message Sender
 * 모든 Slack 메시지 전송을 통합 관리
 */

import { App } from '@slack/bolt';

export interface SendMessageOptions {
  autoSplit?: boolean; // 자동 분할 (기본: true)
  maxLength?: number; // 분할 기준 (기본: 2000)
  blocks?: any[]; // 추가 블록
  updateTs?: string; // 메시지 업데이트
  wrapCodeBlock?: boolean; // 코드 블록 감싸기
  addIndicators?: boolean; // 분할 표시 추가
  delayMs?: number; // 전송 간격
}

/**
 * Slack 메시지 전송 통합 함수
 * Test 1: 짧은 메시지는 일반 전송
 * Test 2: 긴 메시지는 자동 분할
 */
export async function sendSlackMessage(
  app: App,
  channelId: string,
  message: string,
  options?: SendMessageOptions
): Promise<void> {
  const maxLength = options?.maxLength ?? 2000;
  const autoSplit = options?.autoSplit ?? true;

  // 자동 분할이 비활성화되었거나 메시지가 짧으면 그대로 전송
  if (!autoSplit || message.length <= maxLength) {
    await app.client.chat.postMessage({
      channel: channelId,
      text: message,
    });
    return;
  }

  // 메시지 분할
  const chunks: string[] = [];
  let remaining = message;

  while (remaining.length > 0) {
    // 현재 청크 크기 계산 (표시 문자 고려)
    const hasMore = remaining.length > maxLength;
    const chunkSize = hasMore ? maxLength : remaining.length;

    // 청크 추출
    let chunk = remaining.substring(0, chunkSize);
    remaining = remaining.substring(chunkSize);

    // 표시 문자 추가
    if (chunks.length > 0) {
      chunk = '계속...\n' + chunk;
    }
    if (hasMore) {
      chunk = chunk + '\n... 이어짐';
    }

    chunks.push(chunk);
  }

  // 각 청크 전송
  for (const chunk of chunks) {
    await app.client.chat.postMessage({
      channel: channelId,
      text: chunk,
    });
  }
}
