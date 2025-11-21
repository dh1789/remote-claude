/**
 * Unified Slack Message Sender Tests
 * TDD: Red → Green → Refactor
 */

import { App } from '@slack/bolt';
import { sendSlackMessage } from '../slack-messenger';

// Mock Slack App
const createMockApp = () => {
  const mockPostMessage = jest.fn().mockResolvedValue({ ok: true, ts: '1234567890.123456' });
  const mockUpdate = jest.fn().mockResolvedValue({ ok: true, ts: '1234567890.123456' });

  return {
    client: {
      chat: {
        postMessage: mockPostMessage,
        update: mockUpdate,
      },
    },
    _mockPostMessage: mockPostMessage,
    _mockUpdate: mockUpdate,
  } as unknown as App & {
    _mockPostMessage: jest.Mock;
    _mockUpdate: jest.Mock;
  };
};

describe('sendSlackMessage', () => {
  describe('Test 1: 짧은 메시지는 일반 전송', () => {
    it('should send short message with single postMessage call', async () => {
      // Arrange
      const app = createMockApp();
      const channelId = 'C123456';
      const shortMessage = '안녕하세요, 테스트 메시지입니다.'; // ~20자

      // Act
      await sendSlackMessage(app, channelId, shortMessage);

      // Assert
      expect(app._mockPostMessage).toHaveBeenCalledTimes(1);
      expect(app._mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          channel: channelId,
          text: shortMessage,
        })
      );
    });

    it('should send 1000-character message with single postMessage call', async () => {
      // Arrange
      const app = createMockApp();
      const channelId = 'C123456';
      const message1000 = 'A'.repeat(1000); // 1000자

      // Act
      await sendSlackMessage(app, channelId, message1000);

      // Assert
      expect(app._mockPostMessage).toHaveBeenCalledTimes(1);
      expect(app._mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          channel: channelId,
          text: message1000,
        })
      );
    });
  });

  describe('Test 2: 긴 메시지는 자동 분할', () => {
    it('should split 3000-character message into multiple postMessage calls', async () => {
      // Arrange
      const app = createMockApp();
      const channelId = 'C123456';
      const message3000 = 'A'.repeat(3000); // 3000자

      // Act
      await sendSlackMessage(app, channelId, message3000);

      // Assert
      // 기본 maxLength 2000으로 분할되어 최소 2번 호출
      expect(app._mockPostMessage).toHaveBeenCalledTimes(2);

      // 첫 번째 메시지는 2000자 이하 + "... 이어짐" 표시
      const firstCall = app._mockPostMessage.mock.calls[0][0];
      expect(firstCall.channel).toBe(channelId);
      expect(firstCall.text.length).toBeLessThanOrEqual(2020); // "... 이어짐" 포함
      expect(firstCall.text).toContain('... 이어짐');

      // 두 번째 메시지는 나머지 + "계속..." 표시
      const secondCall = app._mockPostMessage.mock.calls[1][0];
      expect(secondCall.channel).toBe(channelId);
      expect(secondCall.text).toContain('계속...');
    });

    it('should respect custom maxLength option', async () => {
      // Arrange
      const app = createMockApp();
      const channelId = 'C123456';
      const message3000 = 'B'.repeat(3000);

      // Act
      await sendSlackMessage(app, channelId, message3000, { maxLength: 1000 });

      // Assert
      // maxLength 1000으로 분할되어 최소 3번 호출
      expect(app._mockPostMessage).toHaveBeenCalledTimes(3);

      // 모든 청크가 1020자 이하 (표시 문자 포함)
      app._mockPostMessage.mock.calls.forEach((call) => {
        expect(call[0].text.length).toBeLessThanOrEqual(1020);
      });
    });

    it('should split 5000-character message into 3 chunks with default maxLength', async () => {
      // Arrange
      const app = createMockApp();
      const channelId = 'C123456';
      const message5000 = 'C'.repeat(5000);

      // Act
      await sendSlackMessage(app, channelId, message5000);

      // Assert
      // 2000자씩 분할: 3번 호출 (2000 + 2000 + 1000)
      expect(app._mockPostMessage).toHaveBeenCalledTimes(3);

      // 첫 번째와 두 번째는 "... 이어짐"
      expect(app._mockPostMessage.mock.calls[0][0].text).toContain('... 이어짐');
      expect(app._mockPostMessage.mock.calls[1][0].text).toContain('계속...');
      expect(app._mockPostMessage.mock.calls[1][0].text).toContain('... 이어짐');

      // 마지막은 "계속..."만
      expect(app._mockPostMessage.mock.calls[2][0].text).toContain('계속...');
      expect(app._mockPostMessage.mock.calls[2][0].text).not.toContain('... 이어짐');
    });
  });

  describe('Test 3: autoSplit=false 동작', () => {
    it('should send long message as-is when autoSplit=false', async () => {
      // Arrange
      const app = createMockApp();
      const channelId = 'C123456';
      const message3000 = 'D'.repeat(3000);

      // Act
      await sendSlackMessage(app, channelId, message3000, { autoSplit: false });

      // Assert
      // 분할 없이 1번만 호출
      expect(app._mockPostMessage).toHaveBeenCalledTimes(1);
      expect(app._mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          channel: channelId,
          text: message3000,
        })
      );
    });

    it('should send very long message as-is when autoSplit=false', async () => {
      // Arrange
      const app = createMockApp();
      const channelId = 'C123456';
      const message10000 = 'E'.repeat(10000);

      // Act
      await sendSlackMessage(app, channelId, message10000, { autoSplit: false });

      // Assert
      // 분할 없이 1번만 호출
      expect(app._mockPostMessage).toHaveBeenCalledTimes(1);

      // 원본 메시지 그대로 전송 (표시 문자 없음)
      const call = app._mockPostMessage.mock.calls[0][0];
      expect(call.text).toBe(message10000);
      expect(call.text).not.toContain('계속...');
      expect(call.text).not.toContain('... 이어짐');
    });

    it('should respect autoSplit=false even with custom maxLength', async () => {
      // Arrange
      const app = createMockApp();
      const channelId = 'C123456';
      const message3000 = 'F'.repeat(3000);

      // Act
      await sendSlackMessage(app, channelId, message3000, {
        autoSplit: false,
        maxLength: 500,
      });

      // Assert
      // autoSplit=false가 우선순위 - 분할 없이 1번만 호출
      expect(app._mockPostMessage).toHaveBeenCalledTimes(1);
      expect(app._mockPostMessage.mock.calls[0][0].text).toBe(message3000);
    });
  });
});
