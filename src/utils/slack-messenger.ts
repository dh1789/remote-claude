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
 */
export async function sendSlackMessage(
  app: App,
  channelId: string,
  message: string,
  _options?: SendMessageOptions
): Promise<void> {
  // 최소 구현: 메시지를 그대로 전송
  await app.client.chat.postMessage({
    channel: channelId,
    text: message,
  });
}
